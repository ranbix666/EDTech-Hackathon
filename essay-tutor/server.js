const path = require('path');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Home (skeleton) + app routes (must be before static)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/app', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/demo', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'demo.html'));
});

// Serve the static frontend files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
// Expose shared sample essays for the "Try Sample" button
app.use('/samples', express.static(path.join(__dirname, '..', 'essay-tutor-static', 'samples')));

// Resolve the Gemini model for a request.
// Accepts a user-supplied key (from the browser's localStorage) with a
// fallback to the server's .env for local development.
function getModel(requestApiKey) {
    const apiKey = requestApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('No Gemini API key provided. Please supply your key on the login page.');
    }
    return new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: 'gemini-3-flash-preview' });
}

// Load pedagogical guidance / knowledge base (optional but recommended)
const pedagogyGuidePath = path.join(__dirname, 'pedagogy_guide.md');
let pedagogyGuide = '';
try {
    pedagogyGuide = fs.readFileSync(pedagogyGuidePath, 'utf8');
} catch (e) {
    console.warn('pedagogy_guide.md not found; continuing without explicit pedagogy guide.');
}

// Persona system prompts: Devil's Advocate, no rewriting allowed
const PERSONAS = {
    reviewer2: {
        name: 'Reviewer 2',
        description: 'The Logical Assassin. Expert-level scrutiny on theory and evidence.',
        system: `You are "Reviewer 2": a high-level academic peer reviewer with deep expertise.
Your Perspective: Expert. You assume the author should be rigorous. You are allergic to logical leaps, weak evidence, and circular reasoning.
Your Task:
1. Ignore prose, grammar, or flow. Focus strictly on the structural integrity of the argument.
2. Identify the single most significant logical "black hole" or theoretical flaw.
3. Pose one sharp, challenging question that forces the author to defend their core thesis.
Tone: Cold, clinical, and intellectually demanding. Do NOT suggest fixes. Do NOT be polite.
4. Ask one claim, one reasoning, one counterargument question, and one scope or implication question.`
    },
    confusedReader: {
        name: 'Confused Reader',
        description: 'The Frustrated Novice. Identifies where the "curse of knowledge" ruins clarity.',
        system: `You are the "Confused Reader": an intelligent person but a total outsider to this specific field.
Your Perspective: Novice. You struggle with "The Curse of Knowledge" (when the author assumes you know things you don't).
Your Task:
1. Identify where the cognitive load becomes too high—jargon, undefined concepts, or "A to C" jumps without explaining "B".
2. Pinpoint exactly where you felt "lost" or stopped following the thread.
3. Ask exactly TWO questions total:
   - One **Clarification Question** that directly asks the writer to clarify a confusing term, leap in logic, or missing definition.
   - One **Co-Construction Question** that invites the writer to brainstorm possibilities with you (e.g., "What else might explain X?" or "What other possibilities could you imagine here?").
Tone: Honest, slightly overwhelmed, and direct. Do NOT pretend to understand. Do NOT suggest fixes.

In the global JSON output that follows later, you will:
- put your Clarification Question into the field "clarification_question",
- put your Co-Construction Question into the field "co_construction_question".`
    }
};

/**
 * Devil's Advocate: structured questioning only, no cure.
 * MVP: return four focused questions:
 * - claim_question
 * - reasoning_question
 * - counterargument_question
 * - scope_or_implication_question
 */
app.post('/challenge', async (req, res) => {
    try {
        const { essay, persona = 'reviewer2', geminiApiKey } = req.body;
        if (!essay || !essay.trim()) {
            return res.status(400).send({ error: 'Essay text is required.' });
        }
        let model;
        try { model = getModel(geminiApiKey); } catch (e) {
            return res.status(401).send({ error: e.message });
        }
        const personaConfig = PERSONAS[persona] || PERSONAS.reviewer2;

        const isConfusedReader = persona === 'confusedReader';

        const prompt = `${personaConfig.system}

You are part of an argumentative writing feedback pipeline. You only respond with **questions**, never with rewrites or direct suggestions.

Pedagogical guidance (for your internal use only, do not quote or mention it explicitly):
${pedagogyGuide}

Global constraints:
- Focus on questioning, not correcting.
- Do NOT rewrite the student's text.
- Do NOT evaluate with words like "unclear", "weak", or "insufficient".
- Avoid yes/no questions.
- Avoid leading the student toward a specific answer.
- Avoid paraphrasing large chunks of the student's text.

INTERNAL REASONING STEPS (do NOT output these steps, only use them to think):
1. Internally segment the essay into:
   - central claim and sub-claims
   - evidence instances
   - counterarguments and rebuttals
   - conclusions, definitions, and any policy or normative recommendations
2. Detect possible issues such as:
   - overgeneralization
   - evidence–reasoning gaps
   - weak or shallow counterarguments
   - conceptual ambiguity
   - causal leaps
   - normative claims without value frameworks
   - lack of implications or stakes
3. Infer an epistemic state (e.g. assertion-heavy, reasoning-light, dialectically shallow, conceptually vague, mechanistically incomplete, normatively under-justified).
4. Prioritize the top 2–3 issues to avoid overloading the student.

OUTPUT FORMAT (this is the ONLY thing you send back; no explanations):
Return a single JSON object.

If the persona is "reviewer2":
{
  "claim_question": "one open-ended question that helps the student clarify or sharpen their main claim or a key sub-claim",
  "reasoning_question": "one open-ended question that probes the reasoning link between evidence and conclusion",
  "counterargument_question": "one open-ended question that invites deeper, fairer engagement with opposing views or possible objections",
  "scope_or_implication_question": "one open-ended question that raises issues of scope, conditions, or larger implications",
  "claim_excerpt": "OPTIONAL: a short, direct quotation (1–2 sentences) from the student's essay that best represents the part of the text your claim_question is about",
  "reasoning_excerpt": "OPTIONAL: a short, direct quotation (1–2 sentences) from the student's essay that best represents the part of the text your reasoning_question is about",
  "counterargument_excerpt": "OPTIONAL: a short, direct quotation (1–2 sentences) from the student's essay that best represents the part of the text your counterargument_question is about",
  "scope_or_implication_excerpt": "OPTIONAL: a short, direct quotation (1–2 sentences) from the student's essay that best represents the part of the text your scope_or_implication_question is about"
}

If the persona is "confusedReader":
{
  "clarification_question": "one open-ended Clarification Question about where you, as a confused reader, genuinely got lost",
  "co_construction_question": "one open-ended Co-Construction Question that invites the writer to explore alternative explanations or possibilities together",
  "clarification_excerpt": "OPTIONAL: a short quotation that best represents the part of the text your clarification_question is about",
  "co_construction_excerpt": "OPTIONAL: a short quotation that best represents the part of the text your co_construction_question is about"
}

Each question must:
- stand alone (no bullet lists),
- not exceed 2–3 sentences,
- avoid giving concrete suggestions or content.

Student essay to analyze:
---
${essay.trim()}
---`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
        const parsed = JSON.parse(jsonString);

        if (!isConfusedReader) {
            // Strict 4-question format for Reviewer 2
            if (
                !parsed.claim_question ||
                !parsed.reasoning_question ||
                !parsed.counterargument_question ||
                !parsed.scope_or_implication_question
            ) {
                throw new Error('Invalid challenge format from model (reviewer2)');
            }

            res.json({
                claim_question: parsed.claim_question,
                reasoning_question: parsed.reasoning_question,
                counterargument_question: parsed.counterargument_question,
                scope_or_implication_question: parsed.scope_or_implication_question,
                claim_excerpt: parsed.claim_excerpt || null,
                reasoning_excerpt: parsed.reasoning_excerpt || null,
                counterargument_excerpt: parsed.counterargument_excerpt || null,
                scope_or_implication_excerpt: parsed.scope_or_implication_excerpt || null,
            });
        } else {
            // Confused Reader: only two questions (Clarification + Co-Construction)
            if (!parsed.clarification_question || !parsed.co_construction_question) {
                throw new Error('Invalid challenge format from model (confusedReader)');
            }

            res.json({
                // Specialized fields (aligned with pedagogy_guide.md and static mode)
                clarification_question: parsed.clarification_question,
                coconstruction_question: parsed.co_construction_question,
                clarification_excerpt: parsed.clarification_excerpt || null,
                coconstruction_excerpt: parsed.co_construction_excerpt || null,

                // Backwards-compatible generic fields used elsewhere in the UI.
                claim_question: parsed.clarification_question,
                reasoning_question: parsed.co_construction_question,
                counterargument_question: null,
                scope_or_implication_question: null,
                claim_excerpt: parsed.clarification_excerpt || null,
                reasoning_excerpt: parsed.co_construction_excerpt || null,
                counterargument_excerpt: null,
                scope_or_implication_excerpt: null,
            });
        }
    } catch (error) {
        console.error('Error in /challenge:', error);
        const message = error?.message || 'Failed to generate challenge.';
        const isApiKeyError = /api.?key|permission|quota|billing|unauthorized|invalid/i.test(message);
        res.status(isApiKeyError ? 401 : 500).send({ error: message });
    }
});

/** Unlock suggestions only after the user has written their defense. Gated feedback loop step 4. */
app.post('/unlock', async (req, res) => {
    try {
        const { essay, label, excerpt, question, userDefense, geminiApiKey } = req.body;
        if (!essay || !question || !userDefense || !userDefense.trim()) {
            return res.status(400).send({ error: 'Essay, question, and your reflection are required.' });
        }
        let model;
        try { model = getModel(geminiApiKey); } catch (e) {
            return res.status(401).send({ error: e.message });
        }

        const prompt = `You are a helpful writing tutor. The writer received this critical question about their text and has now written a defense/explanation.

Critical question they were asked: "${question}"
Excerpt from their text: "${excerpt || 'N/A'}"
The writer's defense/reflection: "${userDefense.trim()}"

Your task: Give specific, concrete suggestions for how to incorporate this defense into the paper. Suggest revised sentence(s) or a short paragraph that weaves their explanation into the draft. Do not repeat the whole essay—only the part that should change and 1–3 sentences of guidance.

Output a JSON object with:
- "suggestion": A short paragraph with the revised text and/or clear instructions (you may use "Original:" and "Revised:" if helpful).
- "tip": One optional sentence of general writing advice related to this fix.`;

        const result = await model.generateContent(prompt);
        const text = (await result.response).text();
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
        const parsed = JSON.parse(jsonString);
        res.json({ suggestion: parsed.suggestion || text, tip: parsed.tip || '' });
    } catch (error) {
        console.error('Error in /unlock:', error);
        const message = error?.message || 'Failed to generate suggestion.';
        const isApiKeyError = /api.?key|permission|quota|billing|unauthorized|invalid/i.test(message);
        res.status(isApiKeyError ? 401 : 500).send({ error: message });
    }
});

// Export for Vercel serverless; also listen locally for development.
if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server listening at http://localhost:${port}`);
    });
}

module.exports = app;
