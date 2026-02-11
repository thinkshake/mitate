# Phase 3 - Market Lifecycle

## Scope and Deliverables
- Market creation flow (admin) with escrow and token setup.
- Betting flow: TrustSet -> Payment -> escrow update -> token mint.
- Market state transitions: Draft -> Open -> Closed.
- Persistence updates for markets, bets, escrows.

## Dependencies
- Phase 2 complete: tx builders, memo utilities, ledger ingestion.

## Acceptance Criteria
- Admin can create a market and it transitions to `Open` after on-ledger confirmation.
- Bets placed before deadline mint outcome tokens and update pool totals.
- Bets after deadline are rejected at API and UI guard.
- Market status updates correctly based on deadline and ledger events.

## Implementation Notes
- Use pooled escrow per market by default; record escrow sequence on create.
- Ensure `TrustSet` is required if trust line missing or limit too low.
- Implement deterministic memo metadata for all market/bet actions.
- Add worker reconciliation to update `pool_total_drops`, `yes_total_drops`, `no_total_drops`.

## Files to Create/Modify
- `apps/api/src/routes/markets.ts`
- `apps/api/src/routes/bets.ts`
- `apps/api/src/services/markets.ts`
- `apps/api/src/services/bets.ts`
- `apps/api/src/db/models/markets.ts`
- `apps/api/src/db/models/bets.ts`
- `apps/api/src/db/models/escrows.ts`
