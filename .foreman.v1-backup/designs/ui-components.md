# MITATE UI Components

## Key Components and State

### MarketCard
State
- `marketId`
- `title`, `status`, `bettingDeadline`
- `poolTotal`, `yesTotal`, `noTotal`
- `priceYes`, `priceNo` (derived from pool totals)

### MarketDetailHeader
State
- `marketId`, `title`, `status`
- `countdown` to betting deadline
- `poolTotal`, `oddsYes`, `oddsNo`

### OutcomeSelector
State
- `selectedOutcome`
- `amountDrops`
- `validationErrors`

### BetForm
State
- `walletConnected`
- `trustlineNeeded`
- `txPayloads`
- `submitStatus`

### TradeForm
State
- `side`, `outcome`, `amountIOU`, `priceDrops`
- `offerPayload`

### PortfolioPanel
State
- `balances` from `account_lines`
- `openBets`, `resolvedBets`
- `pendingPayouts`

### MarketTimeline
State
- `marketStatus`
- `ledgerEvents` list

### AdminResolvePanel
State
- `outcome`, `action`
- `multiSignStatus`
- `payoutBatchProgress`

## Wallet Connection Flow
1. User clicks `Connect Wallet`.
1. App lists providers: Xaman and GemWallet.
1. Provider SDK initializes and requests account access.
1. App verifies `network` is Testnet.
1. App stores wallet address in local state and requests JWT via `/auth/nonce` + `/auth/verify`.
1. App caches JWT in memory and refreshes when needed.

## Real-Time Updates Strategy
- Use SSE at `GET /events` for minimal client overhead.
- Event payloads drive optimistic UI updates.
- Fallback to polling every 20 seconds if SSE disconnected.
- Client updates: pool totals, status changes, and payout confirmations.

## Existing UI Pages to Update

### `app/page.tsx` (Homepage)
- Add live market highlights and current pool totals.
- Add CTA for creating a market if admin.

### `app/markets/page.tsx` (Markets listing)
- Replace mock data with `GET /markets`.
- Include status badges and deadlines.

### `app/markets/[id]/page.tsx` (Market detail)
- Integrate `MarketDetailHeader`, `OutcomeSelector`, `BetForm`.
- Show real-time pool totals and DEX-derived prices.

### `app/portfolio/page.tsx` (Portfolio)
- Show IOU balances and pending payouts.
- Add claim status and history.

### `app/activity/page.tsx` (Activity)
- Show ledger event history and payout events.

### `app/learn/page.tsx` (Learn)
- Update copy to explain parimutuel mechanics and XRPL features used.

## UI State Management
- Use React context for `WalletContext` and `MarketContext`.
- Use `SWR` or `react-query` for data fetching and cache invalidation.
- Keep XRPL tx payloads in component state only.

## Form Validation
- Amounts are integers in drops for XRP.
- Enforce minimum bet size (config).
- Prevent betting after deadline on client and server.

## Error and Empty States
- No markets: show call-to-action to create one.
- Wallet not connected: show connect banner on betting and trading components.
- Trustline missing: show one-click setup with `TrustSet` payload.

