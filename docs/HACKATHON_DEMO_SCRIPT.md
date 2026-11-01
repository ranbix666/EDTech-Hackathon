# Prober.ai Three-Minute Demo Script

## 0:00 to 0:25: Problem

"Most AI writing tools optimize the document. We wanted to optimize the learner's reasoning. When replacement prose appears immediately, accepting an edit is easier than explaining why the argument should change."

Show the landing headline: **Think first. Revise second.**

## 0:25 to 0:45: Product idea

"Prober.ai acts like a rigorous peer reviewer. It asks a question tied to the student's own draft, waits for the student to defend or reconsider the reasoning, and only then unlocks one focused suggestion."

Click **Start the 90-second guided demo**.

## 0:45 to 1:40: Complete one learning loop

1. Point to the Reviewer 2 question and hover or focus it so the exact excerpt highlights in the editor.
2. Say: "The system is probing the claim, not correcting grammar."
3. Click **Use sample defense**. Say: "For presentation speed, this clearly labeled shortcut fills a student response. In normal use, the student writes it."
4. Click **Unlock Suggestion**.
5. Say: "The suggestion did not exist in the interface until the learner made their reasoning visible. The export now preserves the question, response, and support as one traceable learning artifact."

## 1:40 to 2:20: Technical differentiation

Open **Why this stands out**.

"This is more than a prompt wrapper. Each persona has a constrained response schema. Student text is separated from system instructions and treated as untrusted input. Any quoted excerpt is verified against the submitted essay before the interface highlights it. The live path adds rate limits, response validation, safe error mapping, and optional consent-gated research logging."

"The guided path is deliberately deterministic and labeled as pre-loaded. It avoids API quota and latency risk, while the live model path is one click away. The editor is also served locally, so the core demonstration survives unreliable venue Wi-Fi."

## 2:20 to 3:00: Impact and next step

"Our current contribution is an implementable interaction pattern: ask, reflect, then assist. We are not claiming learning gains without data. The next milestone is a controlled classroom study comparing this gated workflow with answer-first feedback on revision quality, transfer, and student reasoning. The product already includes consent-gated instrumentation to make that evaluation possible."

Close with:

"Prober.ai does not try to write instead of the student. It makes the student's thinking the key that unlocks AI help."

## Likely judge questions

### Why not implement this with one chatbot prompt?

The gate is enforced in the interface and API workflow, not requested rhetorically. Challenge generation and suggestion generation are separate calls with different schemas and system instructions. A suggestion cannot be requested from the normal interface until a reflection exists.

### Is the demo actually calling a model?

The guided route is intentionally pre-loaded and says so in the interface. It demonstrates the complete interaction reliably. The separate live route calls Gemini using either a server key or a session-scoped browser key.

### How do you know it improves learning?

We do not claim that yet. The hypothesis is that making reasoning observable before assistance preserves productive effort. The repository includes consent-gated logs and export, and the next step is a comparison study with learning and transfer measures.

### What prevents hallucinated quotations?

The server accepts an excerpt only when the exact text occurs in the submitted essay. Otherwise it returns `null`, so the client cannot highlight an invented quotation.

### What happens to student data?

Normal use does not silently activate study logging. Research logging is disabled in production by default, requires explicit configuration and participant consent, and must use approved persistent storage and governance before a real study.
