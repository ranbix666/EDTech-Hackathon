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
Browser --> GET /app --> index.html + script.js
script.js --> POST /challenge { essay, persona, geminiApiKey }
           --> POST /unlock  { essay, question, userDefense, geminiApiKey }
```

### Backend (`essay-tutor/server.js`)

Single Express file handling all routes:

- `GET /` → `home.html`
- `GET /login` → `login.html`
- `GET /app` → `index.html` (main editor UI)
- `POST /challenge` — sends the student's essay to Gemini with a persona-specific system prompt; returns structured JSON questions
- `POST /unlock` — after the student writes a defense, sends it to Gemini to unlock a concrete revision suggestion; returns `{ suggestion, tip }`

The `getModel(requestApiKey)` helper resolves the API key: user-supplied first, `.env` fallback.

`pedagogy_guide.md` is read at startup and injected into the `/challenge` prompt as background context for the AI (not shown to users).

### Personas

Two personas defined in `PERSONAS` in `server.js`:

- **`reviewer2`** — academic devil's advocate; returns 4 questions: `claim_question`, `reasoning_question`, `counterargument_question`, `scope_or_implication_question` (plus optional `*_excerpt` fields)
- **`confusedReader`** — clarity-focused outsider; returns 2 questions: `clarification_question`, `co_construction_question` (plus optional `*_excerpt` fields)

The `/challenge` response also includes backwards-compatible generic fields (`claim_question`, `reasoning_question`, etc.) for the `confusedReader` persona so the frontend can render it without branching on persona type everywhere.

### Frontend (`essay-tutor/public/`)

- `index.html` + `script.js` — main app (Quill editor, persona selector, feedback panel)
- `home.html` + `home.js` — landing/portal page
- `login.html` — API key entry; stores key in `localStorage`
- `style.css` — all styles; uses CSS variables for theming

Key frontend state in `script.js`:
- `currentPersona` — drives which persona card is active and what fields to render from the `/challenge` response
- `useTabsView` — toggles between tabs and cards layout for feedback
- Theme stored in `localStorage` under key `essayMentorTheme`; toggling adds/removes `theme-orange` class on `<body>`

Excerpt highlighting: when the user hovers a feedback card, `highlightExcerptInEditor()` finds the quoted text in the Quill editor and applies a yellow background via `quill.formatText()`.

### Deployment

Deployed to Vercel via `essay-tutor/vercel.json`. All routes are handled by `server.js` (exported as an Express app via `module.exports = app`). The Gemini model used is `gemini-3-flash-preview`.
