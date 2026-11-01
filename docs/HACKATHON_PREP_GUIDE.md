# Prober.ai Hackathon Readiness Guide

This checklist is specific to Prober.ai. It separates what is ready to show from what still needs evidence.

## The one-sentence pitch

Prober.ai is a reflection-first writing tutor that asks students to defend their reasoning before it unlocks targeted revision help.

## What the demo must prove

- The product targets a clear problem: answer-first AI can make passive editing easier than active reasoning.
- The interaction is meaningfully different: questions come first, student reflection is required, and help is narrowly scoped.
- The AI behavior is constrained: persona-specific schemas, exact-excerpt verification, input bounds, and separated system instructions are implemented in code.
- The demo is honest and resilient: guided outputs are labeled as pre-loaded, the editor is local, and the live model path is visibly separate.
- The concept is testable: consent-gated interaction logs and session export make later classroom evaluation possible.

## Presentation checklist

- Start at `/`, where the value proposition and guided-demo button are visible above the fold.
- Use `/demo` for the judged walkthrough. Do not type a long response live; use **Use sample defense**.
- Hover or focus a challenge so the cited essay passage is highlighted.
- Unlock one suggestion. One complete loop is more persuasive than clicking every tab.
- Open **Why this stands out** after the unlock, so implementation details explain something the judges have already seen.
- Keep `/health` and the GitHub Actions page available in background tabs if a judge asks about operational readiness.

## Claims discipline

Safe claims:

- Prober.ai requires reflection before a suggestion is shown.
- It is designed to preserve productive cognitive effort.
- It records consented interaction data for later evaluation.
- The guided demo works without an AI key or model call.

Claims that require a study before using them:

- Prober.ai improves writing quality.
- Students learn more or retain more than with a general chatbot.
- Teachers save a specific amount of time.
- The system reduces cheating or guarantees academic integrity.

## Remaining product work after a hackathon

1. Run a small usability and learning study with pre/post writing measures.
2. Add instructor-facing cohort views only after defining a legitimate classroom workflow and privacy policy.
3. Replace filesystem study logs with approved persistent storage for real deployments.
4. Evaluate question quality, excerpt grounding, latency, and failure rates across a representative essay set.
5. Add institution-appropriate authentication, retention controls, deletion, and accessibility testing.

## Demo contingency

| Failure | Response |
| --- | --- |
| Model quota, key, or latency issue | Stay on `/demo`; it intentionally makes no model calls. |
| Public internet unavailable | The editor and app remain functional. External fonts/icons may fall back cosmetically. |
| Browser popup blocks export | Use the built-in HTML download fallback. |
| Limited presentation time | Show one Reviewer 2 question, one sample defense, one unlock, then the Judge view. |
| Asked for evidence of learning gains | State that this is the next evaluation milestone and show the consent-gated study instrumentation. |
