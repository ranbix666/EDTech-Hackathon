# Repository guidance

Prober.ai is a reflection-gated argumentative-writing tutor. Preserve its central sequence: question first, student reflection second, limited revision support third.

## Commands

Run from the repository root:

```bash
npm install
npm start
npm run check
npm test
npm run export:study
```

The app is served at `http://localhost:3000`. Node.js 20 or newer is required.

## Configuration

Copy `essay-tutor/.env.example` to `essay-tutor/.env` when local server configuration is needed.

- `GEMINI_API_KEY` is optional. Without it, users can provide a browser key.
- `GEMINI_MODEL` defaults to `gemini-3.7-flash`.
- `AI_RATE_LIMIT_MAX` and `AI_RATE_LIMIT_WINDOW_MS` configure basic AI-endpoint throttling.
- `STUDY_LOGGING_ENABLED` must be explicitly enabled in production.
- `STUDY_LOG_DIR` changes the JSONL destination.
- `TRUST_PROXY` should be enabled only behind a trusted reverse proxy.

Do not commit `.env`, API keys, `study-logs`, `study-exports`, or `node_modules`.

## Server architecture

`essay-tutor/server.js` exports the Express app and listens only when executed directly. This allows both Vercel and the Node test runner to use the same app.

Routes:

- `GET /`, `/login`, `/app`, `/demo`: frontend entry points
- `GET /health`: liveness, version, and model
- `GET /api/config`: non-secret browser configuration
- `POST /challenge`: schema-constrained persona questions
- `POST /unlock`: reflection-gated revision suggestion
- `POST /study/session`, `/study/event`, `/study/draft`: optional research logging

The Gemini integration uses `@google/genai`. Application rules belong in `systemInstruction`; student content is serialized as untrusted user data. Each generation call must use an endpoint-specific `responseSchema`, and the returned JSON must still be validated before it is sent to the browser.

`app.locals.generateStructuredContent` and `app.locals.appendStudyRecord` are injection points used by tests. Keep their call contracts stable.

## Frontend architecture

Files under `essay-tutor/public/` are framework-free HTML, CSS, and JavaScript.

- `auth.js`: API-key storage, safe return URLs, API headers, and server config
- `home.html` and `home.js`: public product landing page
- `login.html` and `login.js`: browser-key entry with session-only storage by default
- `index.html` and `script.js`: Quill editor, live feedback, reflection gate, export, and research instrumentation
- `demo.html` and `demo.js`: no-key demo with static responses
- `style.css`: shared layout, components, themes, and accessibility behavior

Never interpolate model output directly into raw HTML. Use `textContent`, `escapeHtml`, or the existing safe limited-Markdown renderer. When changing Tabs or Cards behavior, preserve the same DOM nodes so entered reflections and unlocked results are not discarded.

## Study instrumentation

Research logging is opt-in and requires the consent-confirmation control. Production defaults to disabled. The local JSONL storage is not durable on serverless platforms. Any real study deployment needs approved persistent storage and appropriate governance.

## Tests

`essay-tutor/test/server.test.js` uses Node's built-in test runner and an ephemeral HTTP port. Tests replace `app.locals.generateStructuredContent` with deterministic stubs, so they never call Gemini or require an API key.

Add coverage for new routes, validation rules, response normalization, and security-sensitive behavior. Keep the suite network-independent.
