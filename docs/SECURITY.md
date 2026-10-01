# Security and Trust

## Implemented demo controls

- Zod validation on API query parameters, path parameters, request bodies and successful response objects.
- Drizzle database operations; application values are passed as bound values rather than built into SQL.
- JSON body limit, same-origin mutation check, disabled credentialed CORS, API security headers, and basic process-local request limits.
- Generic API errors; structured server logging with authorization/cookie redaction. Copilot question text is not stored in its audit event.
- Deterministic Demo AI; no external provider call, no raw customer prompt sent to a model, and no model output execution.
- Human approval is required before the server will execute the separate demo rescue operation.
- Synthetic data only. A suspicious refund/policy-override fixture is marked as blocked and appears in Sarah's timeline.
- Rescue estimates and outcomes are explicitly labeled as synthetic/simulated in the UI and API response.

## OWASP Top 10 mapping

| Area | Demo status |
| --- | --- |
| A01 Broken access control | Synthetic demo only; no authentication, roles or tenant isolation. Production requirement remains open. |
| A02 Cryptographic failures | No credentials or real customer PII are stored by the seed. Transport security is expected from the hosting edge. |
| A03 Injection | Generated Zod validation and Drizzle bound values; no raw SQL interpolation in CXOS handlers. |
| A04 Insecure design | Separate recommendation review and rescue execution; estimates are visibly non-guaranteed. |
| A05 Security misconfiguration | API headers, request-size limit and same-origin checks are present; frontend CSP/edge review remains open. |
| A06 Vulnerable components | Dependency audit has not been completed for this first build. |
| A07 Authentication failures | No login is implemented to preserve one-click demo entry. This blocks real-data use. |
| A08 Software/data integrity | API response validation and controlled server-side state updates; no signed audit chain. |
| A09 Logging and monitoring failures | Structured logs and audit events; no production alerting or tamper-evident audit retention. |
| A10 SSRF | No server-side fetch based on user input exists. |

## OWASP LLM Application Top 10 mapping

| Risk | Demo handling |
| --- | --- |
| Prompt injection | The fixture is flagged as untrusted; deterministic response refuses policy override. No live LLM is connected. |
| Sensitive information disclosure | Synthetic records only; copilot prompt text is not persisted to audit. |
| Supply chain / data poisoning | No model or external retrieval dependency in Demo AI mode. |
| Improper output handling | Copilot returns a strict validated JSON shape rendered as text. |
| Excessive agency | No AI-triggered execution; reviewer decision and explicit execution request are separate. |
| System prompt leakage | There is no provider system prompt or key in the client. |
| Vector/embedding weaknesses | No vector store or embedding retrieval. |
| Misinformation | Answers cite evidence, confidence and limitations; all outputs are labeled Demo AI. |
| Unbounded consumption | Input length and process-local rate limits exist; distributed budgets remain open. |
| Model theft / unauthorized use | No model endpoint or provider credential is configured. |

## Verification status

- Shared TypeScript libraries and API server typecheck passed during this build.
- Development PostgreSQL schema push completed.
- Full automated authz/CSRF/rate-limit/prompt-injection/XSS test suite: **not yet implemented**.
- Dependency audit and external security review: **not yet completed**.

## Responsible disclosure

This hackathon demo is not authorized for testing against third-party systems. For a vulnerability in this project, provide a minimal reproduction to the project owner privately; do not access, modify or retain other users' data.