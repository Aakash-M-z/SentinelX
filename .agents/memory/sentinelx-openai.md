---
name: SentinelX OpenAI Client
description: How OpenAI is wired in this project — user's key, not the AI integrations proxy
---

The project uses `OPENAI_API_KEY` (user's own key) directly via `artifacts/api-server/src/lib/openai.ts`.

**Why:** The user declined the Replit AI integrations upgrade, so `AI_INTEGRATIONS_OPENAI_BASE_URL` and `AI_INTEGRATIONS_OPENAI_API_KEY` are NOT set. The `@workspace/integrations-openai-ai-server` lib throws on import if those vars are missing.

**How to apply:** Always import `openai` and `chatJSON` from `../lib/openai` (relative path from route files) in api-server. Never import from `@workspace/integrations-openai-ai-server`.

Model used: `gpt-4o-mini` with `max_completion_tokens: 2048` for JSON responses, `1024` for chat.
