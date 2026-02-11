# Phase 5 - Frontend Integration

## Scope and Deliverables
- Wallet connection via Xaman and GemWallet.
- Replace mock data with live API calls across pages.
- Real-time updates via SSE.
- Error handling and edge cases in forms and flows.

## Dependencies
- Phase 4 complete: betting, trading, resolution, and payout APIs functional.

## Acceptance Criteria
- User can connect wallet on XRPL Testnet and authenticate with backend.
- Markets list and detail pages show live data and update in real time.
- Betting and trading forms submit valid XRPL tx payloads and handle errors.
- Portfolio and activity pages reflect on-chain state and payouts.

## Implementation Notes
- Use `WalletContext` and data fetching via SWR or react-query.
- SSE fallback to polling when disconnected.
- Enforce deadline validation and trustline requirement in UI.

## Files to Create/Modify
- `apps/web/app/markets/page.tsx`
- `apps/web/app/markets/[id]/page.tsx`
- `apps/web/app/portfolio/page.tsx`
- `apps/web/app/activity/page.tsx`
- `apps/web/app/learn/page.tsx`
- `apps/web/src/contexts/WalletContext.tsx`
- `apps/web/src/contexts/MarketContext.tsx`
- `apps/web/src/lib/api.ts`
