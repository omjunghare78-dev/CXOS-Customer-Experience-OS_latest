# Architecture

## Runtime

```text
Browser (React + TypeScript + Vite)
  └─ same-origin generated API client → /api
       └─ Express 5 API server
            ├─ generated Zod schemas
            ├─ CXOS demo service and deterministic Demo AI
            └─ Drizzle → PostgreSQL
```

The React Query cache is invalidated after decisions, rescue execution and demo reset so dashboard, profile, action and audit views refresh from the API. The UI makes no assumptions that a browser-side state update is the server result.

## Persistence model

- A PostgreSQL JSONB row stores the complete seeded synthetic demo scenario so a reset produces the same starting story and browser reloads preserve completed actions.
- A separate audit table stores reviewer decisions, rescue executions, reset events, initialization and safety events.
- Reset replaces only the synthetic scenario; it records a reset event and does not delete older audit events.
- Development schema uses Drizzle Kit. Production migration has not been validated for a real customer-data deployment.

## AI and action boundary

Demo AI is a deterministic, swappable placeholder that returns answer, evidence, confidence and limitation fields matching the API contract. It makes no network calls and cannot run actions. The action pipeline is:

1. Produce a recommendation from synthetic signals.
2. Human approves, modifies or rejects it.
3. A separate endpoint checks for an approved or modified recommendation.
4. Deterministic server code updates only the local demo state and appends an audit event.

No refund, external message, CRM update or third-party operation is performed.

## Constraints

This build prioritizes the three-minute hackathon demo. The shared demo dataset is not multi-tenant, routes are not protected by user roles, and there is no live Gemini connection. The demo must not be used for real customer data.