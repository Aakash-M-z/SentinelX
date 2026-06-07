# SentinelX

A production-grade, enterprise-level AI-powered cybersecurity platform (Red Team vs Blue Team Cyber Range). Autonomous AI agents battle inside a virtual enterprise network while users command both teams from a centralized SOC operations center.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/sentinelx run dev` — run the React frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts exec tsx src/seed.ts` — re-seed the database
- Required env: `DATABASE_URL`, `OPENAI_API_KEY`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + wouter + TanStack Query + framer-motion + recharts + lucide-react
- API: Express 5 (port 8080)
- DB: PostgreSQL + Drizzle ORM
- AI: OpenAI gpt-4o-mini via `OPENAI_API_KEY` direct (not AI integrations proxy)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle ORM schema files (8 domain files + index.ts)
- `lib/api-client-react/src/generated/` — generated TanStack Query hooks
- `lib/api-zod/src/generated/` — generated Zod schemas
- `artifacts/api-server/src/routes/` — Express route handlers (one file per domain)
- `artifacts/api-server/src/lib/openai.ts` — OpenAI client (uses OPENAI_API_KEY)
- `artifacts/sentinelx/src/pages/` — 9 page components (one per module)
- `scripts/src/seed.ts` — database seed script

## Architecture decisions

- **Contract-first API**: OpenAPI spec → Orval codegen → typed hooks and Zod schemas. Never write raw fetch calls or manual TanStack Query hooks on the frontend.
- **OpenAI direct**: Uses `OPENAI_API_KEY` directly (not `AI_INTEGRATIONS_OPENAI_BASE_URL`/`AI_INTEGRATIONS_OPENAI_API_KEY`). The `@workspace/integrations-openai-ai-server` lib throws on startup without its own env vars — do NOT import it.
- **In-process AI agents**: Red Team, Blue Team, and Commander agents use `chatJSON()` helper to call OpenAI and return structured JSON; results are persisted to the DB.
- **Single simulation model**: One simulation row (`simulationsTable`) is the source of truth for running state. `getOrCreateSimulation()` ensures there's always a row.
- **Attack graph seeded from assets**: Attack graph nodes are created from `networkAssetsTable` rows at seed time; edges are added dynamically as attacks execute.

## Product

- **SOC Command Center** (`/`) — Live simulation control + real-time stats, activity feed, threat heatmap
- **AI Red Team** (`/red-team`) — Autonomous attacker agent, attack timeline, vulnerability findings
- **Attack Graph** (`/attack-graph`) — Dynamic SVG attack path visualization
- **AI Blue Team** (`/blue-team`) — Defender agent, alert triage, firewall rules, detections
- **AI Security Commander** (`/commander`) — Executive reports, risk scoring, compliance status
- **Cyber Range** (`/cyber-range`) — Interactive network topology by zone
- **Threat Intelligence** (`/threat-intel`) — CVE database, threat actors, MITRE coverage, IOCs
- **Incident Response** (`/incidents`) — Case management, timeline, playbook runner
- **Security Copilot** (`/copilot`) — AI chat analyst with live simulation awareness

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- **Never import `@workspace/integrations-openai-ai-server`** — it throws unless `AI_INTEGRATIONS_OPENAI_BASE_URL` is set. Use `artifacts/api-server/src/lib/openai.ts` instead.
- **After schema changes**: run `pnpm --filter @workspace/db run push`, then re-run the seed script.
- **After OpenAPI spec changes**: run `pnpm --filter @workspace/api-spec run codegen` before touching any frontend code.
- **Hook destructuring**: Orval hooks return `UseQueryResult<T>` — always destructure: `const { data } = useListThings()`. Do NOT use the hook result directly.
- **Param routes in Express 5**: `req.params.id` can be an array — always do `Array.isArray(req.params.id) ? req.params.id[0] : req.params.id` before `parseInt`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
