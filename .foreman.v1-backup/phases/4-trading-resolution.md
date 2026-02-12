# Phase 4 - Trading & Resolution

## Scope and Deliverables
- DEX offer creation support (OfferCreate payloads).
- Trade event tracking from ledger events.
- Multi-sign resolution flow (EscrowFinish/EscrowCancel).
- Payout calculation and execution.

## Dependencies
- Phase 3 complete: markets and bets lifecycle wired into DB and ledger ingest.

## Acceptance Criteria
- Users can create offers via API payloads and offers are recorded on-chain.
- Trades are ingested and written to `trades` with memo linkage to market.
- Multi-sign resolution updates market to `Resolved` or `Canceled`.
- Payouts are computed and sent; payouts table reflects status updates.

## Implementation Notes
- Use memo tags on OfferCreate to associate trades with markets.
- Ignore trades after betting deadline for payout calculation.
- Payout formula follows `totalPool * userBet / totalWinningBets` (integer drops).
- Store and distribute rounding remainders to top bettors if needed.

## Files to Create/Modify
- `apps/api/src/routes/offers.ts`
- `apps/api/src/routes/resolve.ts`
- `apps/api/src/services/trades.ts`
- `apps/api/src/services/payouts.ts`
- `apps/api/src/db/models/trades.ts`
- `apps/api/src/db/models/payouts.ts`
