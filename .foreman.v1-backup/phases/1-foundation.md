# Phase 1 - Foundation & Setup

## Scope and Deliverables
- Restructure repo into monorepo layout: `apps/web` (Next.js) and `apps/api` (Hono backend).
- Backend scaffold for Hono API with SQLite storage on Fly.io.
- XRPL client setup (JSON-RPC + WebSocket) targeting Testnet.
- Initial database schema and migrations aligned to design docs.

## Dependencies
- None. This is the first phase.

## Acceptance Criteria
- Repo builds with separate frontend and backend packages.
- Backend starts locally and can connect to SQLite with migrations applied.
- XRPL client can connect to Testnet RPC and WebSocket endpoints with a health check endpoint.
- Initial schema matches `data-model.md` and migrations are runnable and idempotent.

## Implementation Notes
- Keep frontend build unchanged aside from path move; avoid UI changes in this phase.
- Use Fly.io volume + WAL mode for SQLite; ensure a migration lock on startup.
- Store XRPL endpoints and keys in environment variables.
- Prepare a minimal `/health` and `/ready` endpoint for deployment checks.

## Files to Create/Modify
- Create `apps/web/` and move existing Next.js app code under it.
- Create `apps/api/` with Hono server entry, config, and Docker/Fly config.
- Add `apps/api/db/` for migrations and helper.
- Modify root `package.json` and `tsconfig.json` for workspace tooling.
- Add `.foreman/phases/1-foundation.md` (this file).
