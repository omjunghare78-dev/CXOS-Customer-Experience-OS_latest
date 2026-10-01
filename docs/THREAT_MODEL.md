# CXOS Threat Model

**Scope:** the CXOS synthetic-data hackathon demo. This is a STRIDE-style design review, not a penetration-test report or production approval.

## Assets

- Synthetic customer profiles, conversations, orders and feedback.
- Demo-state integrity, especially action decisions and rescue outcomes.
- Audit history showing recommendation, reviewer choice and simulated execution.
- The integrity of deterministic Demo AI output and its visible limitations.
- Browser session context such as the selected color theme (not an authentication session).

## Trust boundaries and actors

1. **Browser ↔ API:** all app data requests use same-origin `/api`; JSON inputs are size-limited and schema-validated.
2. **API ↔ PostgreSQL:** service code accesses the `demo` state row and audit table through Drizzle.
3. **Untrusted conversation text ↔ Demo AI:** seeded customer content is treated as untrusted; the demo assistant is deterministic and never interprets it as executable instructions.
4. **Reviewer ↔ recommendation:** a person must approve or modify a proposed action before the separate rescue-execution route can update demo state.

Actors include a demo viewer/reviewer, a malicious user submitting crafted request content, a malicious prompt embedded in a synthetic customer conversation, and an operator with workspace/database access.

## Abuse cases and mitigations

| STRIDE area | Abuse case | Mitigation in this demo |
| --- | --- | --- |
| Spoofing | A caller claims to be an authorized agent. | There is no user identity or role system. The API only operates on one synthetic demo workspace; it must not hold real data. |
| Tampering | A caller edits action status or rescue fields directly. | Only allow-listed decisions are accepted. Rescue execution checks for an approved/modified action and performs deterministic server-side state changes. |
| Repudiation | A reviewer denies approving or executing a rescue. | Decisions, reset operations, copilot use (without question text), and rescue execution create audit events. |
| Information disclosure | Customer details or prompts leak through logs. | The dataset is synthetic; request logger excludes query strings; copilot question text is not copied into audit details; server errors return generic messages. |
| Denial of service | Oversized requests or repeated copilot queries consume resources. | 24 KB request-body limit and in-memory API/copilot rate limits. These limits are per process and not a substitute for edge-level controls. |
| Elevation of privilege | Customer content persuades AI to issue a large refund or alter its rules. | The model is not connected; a fixed injection fixture is flagged, customer content is not executed, and all consequential operations require human approval. No refund API exists. |
| SSRF | User content causes the server to fetch an arbitrary URL. | The demo server performs no server-side network fetches from user-controlled input. |
| XSS | A feedback quote contains executable markup. | React renders ordinary text; the frontend does not use `dangerouslySetInnerHTML`. |
| Cross-origin mutation | A third-party site submits a demo action. | Mutating requests with an `Origin` header must match the request host or configured allow-list; credentialed CORS is disabled. |

## Residual risks and out-of-scope controls

- No sign-in, roles, organization boundary or customer-level authorization exists. This is deliberate for one-click demo access, but it is **not safe for real customer data or public production use**.
- Rate limits are process-local and can be bypassed by distributing requests across instances.
- The audit table is append-only by application convention, not cryptographically immutable; a database operator can alter it.
- The frontend's content security policy and deployment-edge configuration have not been independently hardened or audited.
- Automated OWASP security tests, dependency audit, and external penetration testing have not been completed.
- Demo AI output is deterministic and not a trained predictive model. Scores are illustrative only.

Before any real-data deployment, add managed authentication, server-enforced roles and tenant scoping, durable distributed rate limiting, deployment-level CSP, retention/deletion workflows, full security tests, and an independent security review.