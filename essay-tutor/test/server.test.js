const assert = require('node:assert/strict');
const { after, before, beforeEach, describe, test } = require('node:test');

process.env.NODE_ENV = 'test';
delete process.env.GEMINI_API_KEY;
delete process.env.STUDY_LOGGING_ENABLED;

const app = require('../server');
const { classifyModelError, parseModelJson, verifiedExcerpt } = app._internals;

let baseUrl;
let server;
let originalGenerator;

before(async () => {
    originalGenerator = app.locals.generateStructuredContent;
    await new Promise((resolve) => {
        server = app.listen(0, '127.0.0.1', () => {
            const address = server.address();
            baseUrl = `http://127.0.0.1:${address.port}`;
            resolve();
        });
    });
});

beforeEach(() => {
    app.locals.generateStructuredContent = originalGenerator;
});

after(async () => {
    await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
    });
});

async function request(pathname, options = {}) {
    const response = await fetch(`${baseUrl}${pathname}`, options);
    const text = await response.text();
    let body = text;
    try {
        body = JSON.parse(text);
    } catch {
        // HTML and sample Markdown remain strings.
    }
    return { body, response, text };
}

function jsonRequest(pathname, payload, headers = {}) {
    return request(pathname, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Gemini-Api-Key': 'test-api-key-with-sufficient-length',
            ...headers,
        },
        body: JSON.stringify(payload),
    });
}

const ESSAY = [
    'Schools should teach media literacy because students encounter persuasive claims every day.',
    'A structured course can help students identify evidence, compare sources, and explain why a claim is credible.',
    'Some critics argue that the topic belongs in existing classes, but dedicated practice makes the reasoning visible.',
].join(' ');

describe('public and operational routes', () => {
    test('health route reports status and applies security headers', async () => {
        const { body, response } = await request('/health');

        assert.equal(response.status, 200);
        assert.equal(body.status, 'ok');
        assert.equal(body.model, 'gemini-3.7-flash');
        assert.equal(response.headers.get('x-powered-by'), null);
        assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
        assert.equal(response.headers.get('cache-control'), 'no-store');
        assert.ok(response.headers.get('x-request-id'));
    });

    test('landing page is public and bundled samples are served', async () => {
        const landing = await request('/');
        const sample = await request('/samples/sample_essay1.md');

        assert.equal(landing.response.status, 200);
        assert.match(landing.text, /90-second guided demo/);
        assert.equal(sample.response.status, 200);
        assert.match(sample.text, /driverless|autonomous|vehicle/i);
    });

    test('guided demo is transparent and its critical editor assets are local', async () => {
        const demo = await request('/demo');
        const demoScript = await request('/demo.js');
        const quillScript = await request('/vendor/quill/quill.js');
        const quillStyles = await request('/vendor/quill/quill.snow.css');

        assert.equal(demo.response.status, 200);
        assert.match(demo.text, /90-second guided demo/);
        assert.match(demo.text, /preloaded model outputs/i);
        assert.doesNotMatch(demo.text, /cdn\.jsdelivr\.net/);
        assert.match(demoScript.text, /Use sample defense/);
        assert.equal(quillScript.response.status, 200);
        assert.match(quillScript.response.headers.get('content-type'), /javascript/);
        assert.equal(quillStyles.response.status, 200);
        assert.match(quillStyles.response.headers.get('content-type'), /css/);
        assert.match(quillStyles.response.headers.get('cache-control'), /immutable/);
    });

    test('client configuration does not expose secrets', async () => {
        const { body, response } = await request('/api/config');

        assert.equal(response.status, 200);
        assert.deepEqual(body, {
            model: 'gemini-3.7-flash',
            serverApiKeyConfigured: false,
            studyLoggingEnabled: false,
        });
        assert.equal(JSON.stringify(body).includes('apiKey'), false);
    });
});

describe('challenge endpoint', () => {
    test('rejects missing, short, and unknown-persona inputs before model calls', async () => {
        let calls = 0;
        app.locals.generateStructuredContent = async () => {
            calls += 1;
            return {};
        };

        const missing = await jsonRequest('/challenge', {});
        const short = await jsonRequest('/challenge', { essay: 'Too short.', persona: 'reviewer2' });
        const unknown = await jsonRequest('/challenge', { essay: ESSAY, persona: 'hostileBot' });

        assert.equal(missing.response.status, 400);
        assert.equal(short.response.status, 422);
        assert.equal(unknown.response.status, 400);
        assert.equal(calls, 0);
    });

    test('returns validated Reviewer 2 questions and drops hallucinated excerpts', async () => {
        let generationRequest;
        app.locals.generateStructuredContent = async (requestOptions) => {
            generationRequest = requestOptions;
            return {
                claim_question: 'What boundary makes this claim appropriately specific?',
                reasoning_question: 'How does the proposed practice lead to the stated learning outcome?',
                counterargument_question: 'What is the strongest reason to integrate this work into existing classes?',
                scope_or_implication_question: 'Under what conditions might a dedicated course be unnecessary?',
                claim_excerpt: 'Schools should teach media literacy',
                reasoning_excerpt: 'This quotation was never in the essay.',
            };
        };

        const { body, response } = await jsonRequest('/challenge', {
            essay: ESSAY,
            persona: 'reviewer2',
        });

        assert.equal(response.status, 200);
        assert.equal(response.headers.get('ratelimit-limit'), '30');
        assert.equal(body.claim_excerpt, 'Schools should teach media literacy');
        assert.equal(body.reasoning_excerpt, null);
        assert.equal(generationRequest.apiKey, 'test-api-key-with-sufficient-length');
        assert.match(generationRequest.systemInstruction, /untrusted content/i);
        assert.ok(generationRequest.responseSchema.required.includes('counterargument_question'));
    });

    test('normalizes Confused Reader output and generic compatibility fields', async () => {
        app.locals.generateStructuredContent = async () => ({
            clarification_question: 'What does credibility mean in the context of this course?',
            co_construction_question: 'What other classroom structures could make this reasoning visible?',
            clarification_excerpt: 'why a claim is credible',
        });

        const { body, response } = await jsonRequest('/challenge', {
            essay: ESSAY,
            persona: 'confusedReader',
        });

        assert.equal(response.status, 200);
        assert.equal(body.claim_question, body.clarification_question);
        assert.equal(body.reasoning_question, body.co_construction_question);
        assert.equal(body.counterargument_question, null);
    });
});

describe('unlock endpoint', () => {
    test('uses the full essay and reflection context and validates the response', async () => {
        let generationRequest;
        app.locals.generateStructuredContent = async (requestOptions) => {
            generationRequest = requestOptions;
            return {
                suggestion: 'Add one sentence explaining how repeated source comparison builds the stated skill.',
                tip: 'Make the warrant between an activity and its learning outcome explicit.',
            };
        };

        const { body, response } = await jsonRequest('/unlock', {
            essay: ESSAY,
            label: 'REASONING',
            excerpt: 'compare sources',
            question: 'How does the proposed practice lead to the stated learning outcome?',
            userDefense: 'Repeated comparison gives students a routine for articulating credibility judgments.',
        });

        assert.equal(response.status, 200);
        assert.match(body.suggestion, /Add one sentence/);
        assert.match(generationRequest.contents, /Repeated comparison/);
        assert.match(generationRequest.contents, /Schools should teach media literacy/);
        assert.ok(generationRequest.responseSchema.required.includes('suggestion'));
    });

    test('rejects an empty reflection without calling the model', async () => {
        let calls = 0;
        app.locals.generateStructuredContent = async () => {
            calls += 1;
            return {};
        };

        const { response } = await jsonRequest('/unlock', {
            essay: ESSAY,
            question: 'Why?',
            userDefense: '   ',
        });

        assert.equal(response.status, 400);
        assert.equal(calls, 0);
    });
});

describe('defensive helpers', () => {
    test('parses bare, fenced, and prose-wrapped JSON', () => {
        assert.deepEqual(parseModelJson('{"answer":"bare"}'), { answer: 'bare' });
        assert.deepEqual(parseModelJson('```json\n{"answer":"fenced"}\n```'), { answer: 'fenced' });
        assert.deepEqual(parseModelJson('Result: {"answer":"wrapped"} done.'), { answer: 'wrapped' });
    });

    test('only accepts excerpts that occur verbatim in the essay', () => {
        assert.equal(verifiedExcerpt('compare sources', ESSAY), 'compare sources');
        assert.equal(verifiedExcerpt('invented source quote', ESSAY), null);
    });

    test('maps provider failures to safe HTTP responses', () => {
        assert.deepEqual(classifyModelError({ status: 429, message: 'quota exceeded' }), {
            status: 429,
            message: 'Gemini rate limit or quota reached. Wait briefly or check the key quota.',
        });
        assert.equal(classifyModelError(new Error('internal stack detail')).status, 502);
    });

    test('rejects malformed JSON bodies and disabled study logging', async () => {
        const malformed = await request('/challenge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{not valid json',
        });
        const study = await request('/study/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: 'session-1', consentConfirmed: true }),
        });

        assert.equal(malformed.response.status, 400);
        assert.equal(study.response.status, 503);
    });
});
