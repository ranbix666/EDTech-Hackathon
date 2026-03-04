## EDTech Hackathon Project – Prober.ai

This repository contains our NY EDTech Hackathon project **Prober.ai**, plus supporting demos. The main app is an argumentative writing tutor that uses Gemini to act as a critical “devil’s advocate” rather than a ghostwriter.

### 1. The Problem

Students often get **editing or rewriting** from AI tools instead of **deep questioning** that helps them strengthen their own reasoning. This encourages dependency and hides the actual thinking work.

### 2. The Solution – Prober.ai

Prober.ai is a web app that:

- **Interrogates arguments instead of rewriting them**: the AI plays roles like *Reviewer #2* or *Confused Reader* and only responds with targeted questions.
- **Surfaces one weak link at a time**: it returns four focused questions (claim, reasoning, counterargument, scope/implications) to avoid overload.
- **Gates suggestions behind reflection**: students must first write a defense/response to a question before any concrete suggestions are “unlocked”.
- **Feels like a modern writing tool**: Quill-based editor, responsive layout, and a theme toggle (Sapphire Blue ↔ Orange).

### 3. Key Features

- **Persona-based feedback**
  - Choose critics like `Reviewer #2` (rigorous academic) or `Confused Reader` (clarity-focused).
  - Persona is passed through to the backend to shape the system prompt.

- **Devil’s Advocate challenge (`/challenge`)**
  - Backend endpoint `POST /challenge` takes `{ essay, persona }`.
  - Uses Gemini (`gemini-3-flash-preview`) with a detailed system prompt plus optional `pedagogy_guide.md`.
  - Returns a JSON object.
    - For the `reviewer2` persona, the object contains:
      - `claim_question`
      - `reasoning_question`
      - `counterargument_question`
      - `scope_or_implication_question`
      - `claim_excerpt` (optional)
      - `reasoning_excerpt` (optional)
      - `counterargument_excerpt` (optional)
      - `scope_or_implication_excerpt` (optional)
    - For the `confusedReader` persona, the object contains:
      - `clarification_question`
      - `co_construction_question`
      - `clarification_excerpt` (optional)
      - `co_construction_excerpt` (optional)

- **Gated “unlock” suggestions (`/unlock`)**
  - Frontend collects the student’s written defense before calling `POST /unlock`.
  - Backend prompts Gemini to:
    - Suggest specific revised sentences/paragraphs.
    - Provide a short writing tip related to that fix.
  - Response shape: `{ suggestion, tip }`.

- **Modern frontend UI**
  - Rich text editor using **Quill**.
  - Responsive 3-panel layout: persona sidebar, editor, feedback panel.
  - Session stats (challenge count, defense count).
  - Toast notifications and small UI touches (button ripple, tips carousel).
  - **Theme toggle** in the top-right:
    - Default **Sapphire Blue** theme via CSS variables.
    - Alternate **Orange** theme via a `theme-orange` body class.
    - Choice is persisted in `localStorage`.

- **Additional demo – `llm-chatbot-demo`**
  - Minimal HTML/JS demo of a student AI assistant chat UI (`index.html`, `script.js`).

### 4. Tech Stack

- **Frontend**
  - Vanilla HTML/CSS/JS.
  - [Quill](https://quilljs.com/) editor (`snow` theme).
  - Font Awesome icons.

- **Backend**
  - **Node.js** with **Express**.
  - **body-parser** for JSON request parsing.

- **AI / APIs**
  - `@google/generative-ai` (Gemini API – `gemini-3-flash-preview`).
  - System prompts encoded in `essay-tutor/server.js`.

- **Configuration**
  - Environment variables via **dotenv**:
    - `GEMINI_API_KEY` (required for Prober.ai backend).

### 5. Running the Project

From the repo root:

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up environment for Prober.ai**

   In `essay-tutor/.env`:

   ```bash
   GEMINI_API_KEY=your_api_key_here
   ```

3. **Start the Prober.ai server**

   ```bash
   cd essay-tutor
   node server.js
   ```

   Then open `http://localhost:3000` in your browser.

4. **Open the LLM chatbot demo (static)**

   - Serve `llm-chatbot-demo/` with any static server (e.g., VS Code Live Server, `npx serve llm-chatbot-demo`), then open the served URL in your browser.

### 6. Team Members

- Shiyao Wei
- Yuanyiyi Zhou
- Ran Bi
