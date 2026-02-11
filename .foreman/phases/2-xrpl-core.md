# Phase 2 - XRPL Core Integration

## Scope and Deliverables
- XRPL transaction builders for Escrow, Payment, TrustSet, OfferCreate.
- Memo encoding/decoding utilities following MITATE memo spec.
- WebSocket subscription setup for `account_tx` and `ledger`.
- Ledger event ingestion into `ledger_events` table with idempotency.

## Dependencies
- Phase 1 complete: backend scaffold, DB migrations, XRPL client connectivity.

## Acceptance Criteria
- `tx-builder` outputs valid XRPL tx JSON with memos for all required types.
- Memo encoding/decoding round-trips without data loss.
- WebSocket worker can subscribe and ingest `account_tx` and `ledger` events.
- Ingestion writes to `ledger_events` with unique tx hash and ledger index.

## Implementation Notes
- Follow `xrpl-integration.md` memo format (`MemoType=MITATE`, JSON in MemoData).
- Centralize XRPL client to reuse connections and handle reconnects.
- Store `last_ledger_index` in `system_state` for backfill on restart.
- Use a normalized internal event type map to avoid re-parsing downstream.

## Files to Create/Modify
- `apps/api/src/xrpl/client.ts`
- `apps/api/src/xrpl/tx-builder.ts`
- `apps/api/src/xrpl/memo.ts`
- `apps/api/src/xrpl/ledger-sync.ts`
- `apps/api/src/db/models/ledger-events.ts`
- `apps/api/src/db/models/system-state.ts`
