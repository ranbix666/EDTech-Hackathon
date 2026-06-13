# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from the `essay-tutor/` directory unless noted.

```bash
# Install dependencies (run from repo root)
npm install

# Start the dev server
cd essay-tutor && node server.js
# App available at http://localhost:3000
```

There are no tests or linting configured.

## Environment Setup

Create `essay-tutor/.env` with:
```
GEMINI_API_KEY=your_api_key_here
```

The server also accepts a user-supplied key from the browser's `localStorage` (`geminiApiKey`), which takes priority over `.env`. Users enter their key on the `/login` page.

## Architecture

### Request Flow

```
Browser (login page) --> localStorage stores geminiApiKey
Browser --> GET /app  --> index.html + script.js
Browser --> GET /demo --> demo.html + demo.js  (no API key needed)
script.js --> POST /challenge { essay, persona, geminiApiKey }
           --> POST /unlock  { essay, label, excerpt, question, userDefense, geminiApiKey }
```

### Backend (`essay-tutor/server.js`)

Single Express file handling all routes:

- `GET /` → `home.html`
- `GET /login` → `login.html`
- `GET /app` → `index.html` (main editor UI)
- `GET /demo` → `demo.html` (self-contained demo with pre-baked feedback; no API key required)
- `GET /health` → `{ status: 'ok', uptime }` (lightweight liveness check)
- `GET /samples/*` → static files from `../essay-tutor-static/samples/` (shared sample essays for the "Try Sample" button)
- `POST /challenge` — sends the student's essay to Gemini with a persona-specific system prompt; returns structured JSON questions
- `POST /unlock` — after the student writes a defense, sends it to Gemini to unlock a concrete revision suggestion; accepts `label` and `excerpt` alongside the essay/question/defense; returns `{ suggestion, tip }`

The server listens on `process.env.PORT || 3000`. JSON bodies are capped at `1mb`,
and `/challenge` and `/unlock` reject oversized input with HTTP 413
(`MAX_ESSAY_CHARS = 20000`, `MAX_DEFENSE_CHARS = 8000`). Shared helpers
`parseModelJson()` (extracts JSON from fenced/bare model output) and
`isApiKeyError()` (maps SDK errors to 401 vs 500) are reused by both endpoints.

The `getModel(requestApiKey)` helper resolves the API key: user-supplied first, `.env` fallback.

`pedagogy_guide.md` is read at startup and injected into the `/challenge` prompt as background context for the AI (not shown to users).

### Personas

Two personas defined in `PERSONAS` in `server.js`:

- **`reviewer2`** — academic devil's advocate; returns 4 questions: `claim_question`, `reasoning_question`, `counterargument_question`, `scope_or_implication_question` (plus optional `*_excerpt` fields)
- **`confusedReader`** — clarity-focused outsider; returns 2 questions: `clarification_question`, `co_construction_question` (plus optional `*_excerpt` fields)

The `/challenge` response also includes backwards-compatible generic fields (`claim_question`, `reasoning_question`, etc.) for the `confusedReader` persona so the frontend can render it without branching on persona type everywhere.

### Frontend (`essay-tutor/public/`)

- `index.html` + `script.js` — main app (Quill editor, persona selector, feedback panel)
- `demo.html` + `demo.js` — offline demo mode with a pre-baked essay + feedback (both personas); no server calls
- `home.html` + `home.js` — landing/portal page
- `login.html` — API key entry; stores key in `localStorage`
- `style.css` — all styles; uses CSS variables for theming
- `icon.jpg` / `iconBlue.jpg` — brand icons used in the nav bar

Key frontend state in `script.js`:
- `currentPersona` — drives which persona card is active and what fields to render from the `/challenge` response
- `useTabsView` — toggles between tabs and cards layout for feedback
- Theme stored in `localStorage` under key `essayMentorTheme`; toggling adds/removes `theme-orange` class on `<body>`

Excerpt highlighting: when the user hovers a feedback card, `highlightExcerptInEditor()` finds the quoted text in the Quill editor and applies a yellow background via `quill.formatText()`.

Safe rendering: all model-generated text is treated as untrusted. Questions are
written with `textContent`; the unlocked suggestion is rendered through
`renderMarkdownSafe()` (HTML-escapes first, then re-applies a limited Markdown
subset — bold/italic/code, `Original:`/`Revised:` labels, line breaks); toast
messages and tips go through `escapeHtml()`. Never interpolate model output into
`innerHTML` directly.

Unlock loop: an unlocked suggestion renders **Copy** (clipboard) and **Insert
into draft** (appends to the end of the Quill editor) actions so the student can
apply the revision themselves.

Accessibility: persona tabs and feedback tabs use a roving `tabindex` with
arrow/Home/End keyboard navigation. The ambient particle animation is skipped
when `prefers-reduced-motion` is set (CSS also neutralizes animations/transitions).

Onboarding: a one-time, dismissible banner (localStorage key
`proberOnboardingSeen`) explains the gated, no-rewrite model; its height is
measured into the `--onboarding-banner-h` CSS variable to offset the layout.

### Deployment

Deployed to Vercel via `essay-tutor/vercel.json`. All routes are handled by `server.js` (exported as an Express app via `module.exports = app`). The Gemini model used is `gemini-3-flash-preview`.
