# CXOS

CXOS is an AI customer experience operating system demo. It connects synthetic customer signals to explainable, human-reviewed actions and shows a measured-looking but clearly simulated rescue outcome.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API server
- `pnpm --filter @workspace/cxos run dev` — CXOS web app
- `pnpm --filter @workspace/db run push` — apply the development PostgreSQL schema
- `pnpm --filter @workspace/api-spec run codegen` — regenerate client hooks and Zod schemas from OpenAPI
- `pnpm run typecheck` — workspace typecheck
- Required environment: `DATABASE_URL` for the preconfigured PostgreSQL database

## Stack

- pnpm workspace, TypeScript 5.9
- Frontend: React, Vite, Wouter, TanStack Query, Tailwind CSS, Recharts-compatible chart primitives, lucide-react
- API: Express 5, pino, generated Zod validation
- Data: PostgreSQL through Drizzle
- AI: deterministic Demo AI; no live model provider is configured

## Where things live

- `artifacts/cxos/src/App.tsx` — CXOS routes and interaction flows
- `artifacts/cxos/src/index.css` — theme and responsive styles
- `artifacts/api-server/src/routes/cxos.ts` — CXOS API contract implementation
- `artifacts/api-server/src/cxos/` — deterministic dataset and demo state service
- `lib/api-spec/openapi.yaml` — source API contract
- `lib/db/src/schema/cxos.ts` — PostgreSQL schema and persisted demo state types
- `docs/` — architecture, threat model, security mapping, pitch, judging map and demo script

## Architecture decisions

- The first build uses one persistent synthetic demo workspace so judges can launch without registration; it is not multi-tenant and must not contain real customer data.
- Demo AI stays deterministic and server-side until a live provider is deliberately integrated; API response shapes already include evidence, confidence and limitations.
- Rescue approval and rescue execution are separate operations. Reset restores demo state but retains previous audit events.

## Product

The app includes executive overview, inbox, customer portfolio and 360 timeline, sentiment/root-cause/journey/voice-of-customer intelligence, action review, Demo AI copilot, and audit/trust surfaces. Sarah Williams anchors the rescue demo.

## Gotchas

- The API expects the shared proxy path `/api`; frontend calls must remain same-origin.
- Run the development schema push before using the API in a fresh database.
- Customer health and churn numbers and the rescue result are demo estimates, not measured outcomes.
- Authentication, tenant isolation and production security tests are still required before any real-data deployment.