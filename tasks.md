Act as an expert academic researcher, data scientist, and technical writer specializing in Educational Technology, Natural Language Processing, and Educational Data Mining.

I have developed an EdTech project during a hackathon and want to publish a rigorous, high-quality technical report on arXiv. The tone should be highly analytical, precise, and suitable for peer-reviewed standards akin to conferences like EDM, CSCW, or Learning at Scale. The authorial voice should reflect my professional background: a Ph.D. in Computer Science and Education Technology, currently working as a Senior Research Statistician Developer, with deep expertise in rigorous statistical analysis and advanced LLM integration.

Here is the context and raw material for the project:

Project Name: Prober.ai

Authors: Shiyao Wei, Yuanyiyi Zhou, and Ran Bi

Core Educational Problem Solved: Students frequently rely on AI tools for editing or rewriting, which short-circuits critical thinking and encourages dependency. Prober.ai addresses this by replacing AI ghostwriting with deep, targeted questioning that forces students to strengthen their own reasoning and defend their arguments.

Technical Architecture & AI Integration: The platform operates on a Node.js/Express backend with a responsive vanilla HTML/CSS/JS frontend utilizing the Quill editor. The core AI engine integrates the @google/generative-ai SDK (gemini-3-flash-preview). Rather than generating open-ended text, the architecture utilizes strict system prompts and an optional pedagogy_guide.md to force the LLM to output structured JSON schemas that align with specific pedagogical goals.

Key Features & Mechanics: >   1. Persona-Based Feedback: The LLM is constrained to specific critical personas (e.g., rigorous 'Reviewer #2' or clarity-focused 'Confused Reader'), which dynamically alters the system prompt and the resulting JSON structure.
2. Devil’s Advocate Challenge (/challenge): Interrogates arguments by returning exactly four targeted questions (claim, reasoning, counterargument, scope/implications) and optional text excerpts, specifically designed to prevent cognitive overload.
3. Gated Suggestions (/unlock): Implements a pedagogical friction point where students must submit a written defense of their argument before the backend calls the LLM to unlock specific revised sentences and writing tips ({ suggestion, tip }).

Hackathon Outcomes/Metrics: winning the second place in this hackathon. 

Based on this information, please draft a comprehensive, arXiv-style technical report. Structure the report with the following sections:

Abstract: A concise, 150-word summary of the pedagogical problem, the Prober.ai architecture, and the system's impact.

Introduction: The motivation behind the project, the context within current AI-driven EdTech, and our specific technical contributions regarding LLM prompt constraints and JSON structuring.

Related Work: A brief overview of similar approaches (e.g., conversational AI tutors, educational data mining) and how this project differs by gating feedback behind user reflection. Include placeholders for citations.

System Architecture & Methodology: A detailed, rigorous breakdown of the technical design, data flow, and algorithmic choices. Use formal, descriptive language to explain the backend logic, the POST /challenge and POST /unlock endpoints, and how the LLM was constrained to output predictable JSON.

Implementation Details: The specific tools (Express, Gemini Flash preview, Quill) and deployment strategies used to build the prototype.

Preliminary Evaluation & Proof of Concept: An analysis of the hackathon outcomes, system performance, latency considerations for the Gemini API, or qualitative results.

Discussion & Future Work: Limitations of the current hackathon build and how the architecture could be scaled or evaluated in a real-world educational setting.

Conclusion.

Output Format: Please generate the entire report in clean, well-structured LaTeX format, ready to be compiled for an arXiv submission. Use standard article class formatting, include placeholders for diagrams (e.g., \begin{figure}), and use \cite{placeholder} where relevant literature should be added later. Ensure the prose is objective, academic, and compelling.