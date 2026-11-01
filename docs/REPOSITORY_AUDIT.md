# Repository audit

Audit date: 2026-08-23

## Scope

This audit reviewed repository hygiene, dependency management, runtime behavior, AI-response reliability, browser onboarding, research instrumentation, security controls, documentation, and automated verification.

## Findings and changes

| Area | Baseline finding | Change in `feature/reliability-ux` |
| --- | --- | --- |
| Git hygiene | 677 generated `node_modules` files were tracked, increasing repository size and obscuring meaningful diffs. | Removed the dependency tree from Git tracking and added root-level ignore rules. |
| Local configuration | `.claude/settings.local.json` was tracked even though it contains machine-specific tool permissions. | Removed it from Git tracking and ignored future local copies. |
| Dependency layout | Root and application manifests declared different versions of the same packages. Root `npm start` was not defined. | Converted the root into an npm workspace with consistent start, check, test, and export commands. |
| Reproducibility | The application relied on committed dependencies instead of a clean install. | Regenerated one workspace-aware `package-lock.json`; a clean `npm ci` now succeeds. |
| Dependency security | The initial resolved tree included vulnerable transitive versions of `body-parser`, `path-to-regexp`, and `qs`. | Updated compatible transitive versions. `npm audit --omit=dev` reports zero known vulnerabilities. |
| AI SDK | The app used the no-longer-maintained `@google/generative-ai` SDK and a preview model identifier. | Migrated to `@google/genai` 2.18.0 and made `GEMINI_MODEL` configurable, with `gemini-3.7-flash` as the default. |
| Prompt boundaries | System rules, pedagogical guidance, and student text were concatenated into one prompt string. | Moved application rules into `systemInstruction` and serialized student text as explicitly untrusted user data. |
| Output reliability | JSON was requested through prose and validated only by checking a few truthy fields. | Added endpoint-specific JSON schemas, robust parsing fallbacks, type and length validation, and response normalization. |
| Excerpt integrity | Model-generated excerpts were returned even if they did not occur in the essay. | Excerpts are now returned only when they match the submitted essay verbatim. |
| Unlock quality | The unlock prompt did not include the full essay even though the endpoint accepted it. | The full draft, challenged excerpt, question, and student reflection are now provided as structured context. |
| Error handling | Raw provider messages could be returned to the browser, and quota errors were treated as invalid keys. | Added safe error classification for authentication, quota, unavailable model, timeout, and upstream failures. |
| Request safety | The app exposed Express defaults and had no AI endpoint throttling. | Disabled the framework signature, added security headers and request IDs, and added configurable per-process throttling. |
| Sample route | `/samples` pointed to a non-existent sibling directory. | The route now serves `essay-tutor/samples`; an HTTP test covers it. |
| Landing experience | The public landing page immediately redirected visitors to the API-key page, hiding the no-key demo. | The landing page is public. Only the live editor requests a key when no server key exists. |
| Return navigation | Selecting a persona before login lost the requested destination. | Added validated same-origin return paths so login resumes the intended editor and persona. |
| API-key storage | Browser keys were always persisted in `localStorage`. | Session-only storage is now the default; persistence requires an explicit checkbox. New requests send the key in a header rather than the JSON body. |
| Feedback views | Switching between Tabs and Cards rebuilt the feedback DOM and erased reflections and unlock progress. | Both modes now reuse the same challenge nodes, preserving all in-progress work. |
| File import | The file picker advertised DOCX support but passed binary DOCX data to `readAsText`. | Limited import to `.txt` and `.md`, with type guidance and a 1 MB limit. |
| Research consent | The client sent `consentConfirmed: true` without a distinct confirmation control. | Added explicit consent confirmation, server-side enforcement, production opt-in, ID validation, and size limits. |
| Serverless research logs | Local JSONL writes were described without clearly stating that serverless disks are not durable. | Documented the limitation and the need for approved persistent storage before a real study deployment. |
| Automated quality | The repository had no passing tests, syntax command, or CI workflow. | Added 12 network-independent server tests, JavaScript syntax checks, GitHub Actions CI, and Dependabot configuration. |
| Editor version | Both interfaces loaded Quill 1.3.6. | Updated the CDN build and theme to Quill 2.0.3 while retaining plain-text extraction for API requests and exports. |

## Verification

The branch was verified with:

- clean dependency installation using `npm ci --ignore-scripts`;
- JavaScript syntax checks for the server, browser scripts, and export utility;
- 12 Node tests covering routes, security headers, input validation, both personas, unlock context, schema normalization, JSON parsing, excerpt verification, safe error mapping, malformed requests, and disabled study logging;
- production dependency audit with zero known vulnerabilities;
- `git diff --check` for patch-format and whitespace errors;
- a repository-wide scan for committed API keys and private-key material.

No live Gemini request is made by CI. Model calls are replaced with deterministic stubs so tests remain fast, repeatable, and free of API cost.

## Remaining limitations

1. Study logs still use a local filesystem. Vercel and similar serverless deployments require approved durable storage before research data can be collected reliably.
2. The rate limiter is per process. A multi-instance deployment should add a gateway or shared-store limiter.
3. Browser flows are covered indirectly through server and static-asset tests, but the repository does not yet include Playwright or another full browser test suite.
4. Quill, fonts, and icons are loaded from external CDNs. A classroom deployment with strict offline or content-security requirements should self-host pinned assets.
5. CI does not verify a live Gemini model. A separately controlled smoke test can be added using a restricted test key and a small budget.
6. Product efficacy still requires a preregistered study or another rigorous evaluation. Working software and correct instrumentation do not establish learning impact by themselves.

## Recommended next steps

1. Add an approved database-backed study repository with retention and deletion controls.
2. Add browser tests for login return paths, persona selection, reflection persistence, export, and mobile layout.
3. Add a small, versioned evaluation set for question quality and schema compliance across model changes.
4. Instrument latency, upstream error class, and token use without logging API keys or unnecessary student text.
5. Run the planned educational evaluation and report both process measures and writing outcomes.
