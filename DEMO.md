# MITATE Demo Guide

**Hackathon:** JFIIP Demo Day — February 24, 2026  
**Duration:** 3 minutes  
**Audience:** Judges evaluating XRPL feature usage

---

## Quick Reference: Market Lifecycle

```
POST /api/markets              → Creates market in "Draft" status
POST /api/markets/:id/confirm  → Transitions to "Open" (after signing escrow tx)
POST /api/markets/:id/test-open → Transitions to "Open" (skip escrow, for testing)
POST /api/markets/:id/close    → Transitions to "Closed" (stops betting)
POST /api/markets/:id/resolve  → Transitions to "Resolved" (declares winner)
POST /api/markets/:id/payouts  → Generates payout transactions
```

---

## Pre-Demo Setup

### 1. Start Services

```bash
cd ~/dev/mitate
docker-compose up -d

# Verify
curl http://localhost:3001/health
```

### 2. Set Admin Key

```bash
export ADMIN_KEY="your-admin-key"  # From .env
```

### 3. Fund Operator Wallet

Get testnet XRP: https://faucet.altnet.rippletest.net/accounts

---

## 1. Create Multi-Outcome Market

Unlike YES/NO binary markets, multi-outcome markets support 2-5 outcomes.

```bash
# Japanese political election (4 outcomes)
curl -X POST http://localhost:3001/api/markets \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: $ADMIN_KEY" \
  -d '{
    "title": "2026年宮城県知事選挙の当選者予想",
    "description": "2026年に予定される宮城県知事選挙の当選者を予測します。",
    "category": "politics",
    "categoryLabel": "政治",
    "bettingDeadline": "2026-06-15T00:00:00Z",
    "resolutionTime": "2026-06-20T00:00:00Z",
    "outcomes": [
      { "label": "村井嘉浩（現職）" },
      { "label": "新人候補A" },
      { "label": "新人候補B" },
      { "label": "その他" }
    ]
  }'
```

**Response:**
```json
{
  "id": "mkt_abc123",
  "status": "Draft",
  "outcomes": [
    { "id": "out_1", "label": "村井嘉浩（現職）", "probability": 25 },
    { "id": "out_2", "label": "新人候補A", "probability": 25 },
    { "id": "out_3", "label": "新人候補B", "probability": 25 },
    { "id": "out_4", "label": "その他", "probability": 25 }
  ],
  "escrowTx": { /* XRPL EscrowCreate transaction to sign */ }
}
```

### Binary Market (YES/NO)

Omit `outcomes` to create a traditional YES/NO market:

```bash
curl -X POST http://localhost:3001/api/markets \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: $ADMIN_KEY" \
  -d '{
    "title": "Will Bitcoin reach $100K by March 2026?",
    "description": "Resolves YES if BTC/USD reaches $100,000.",
    "category": "crypto",
    "bettingDeadline": "2026-03-30T23:59:59Z"
  }'
```

---

## 2. Open Market (Draft → Open)

After creating, the market is in "Draft" status. To open it:

1. **Sign the escrowTx** returned from creation using operator wallet
2. **Confirm** with the transaction hash:

```bash
curl -X POST http://localhost:3001/api/markets/mkt_abc123/confirm \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: $ADMIN_KEY" \
  -d '{
    "escrowTxHash": "ABC123...",
    "escrowSequence": 12345
  }'
```

**Response:**
```json
{
  "data": {
    "id": "mkt_abc123",
    "status": "Open"
  }
}
```

Now the market accepts bets!

### Quick Open (Testing Only)

For demos, skip XRPL escrow with test-open:

```bash
curl -X POST http://localhost:3001/api/markets/mkt_abc123/test-open \
  -H "X-Admin-Key: $ADMIN_KEY"
```

**Response:**
```json
{
  "data": {
    "id": "mkt_abc123",
    "status": "Open",
    "message": "Market opened for testing (no XRPL escrow)"
  }
}
```

---

## 3. Place Bets

Users bet on outcomes via the frontend or API:

```bash
# Bet 10 XRP on outcome "out_1" (村井嘉浩)
curl -X POST http://localhost:3001/api/markets/mkt_abc123/bets \
  -H "Content-Type: application/json" \
  -d '{
    "outcomeId": "out_1",
    "bettorAddress": "rUserWalletAddress...",
    "amountDrops": "10000000"
  }'
```

**Response:**
```json
{
  "bet": {
    "id": "bet_xyz",
    "outcomeId": "out_1",
    "amountDrops": "10000000",
    "weightScore": 1.5,
    "effectiveAmountDrops": "15000000"
  },
  "unsignedTx": { /* Payment tx for user to sign */ }
}
```

The `effectiveAmountDrops` includes the user's weight multiplier.

---

## 4. Trade on DEX

Outcome tokens can be traded on XRPL's native DEX before resolution.

### Create Sell Offer

```bash
# Sell 5 outcome tokens for 8 XRP
curl -X POST http://localhost:3001/api/markets/mkt_abc123/offers \
  -H "Content-Type: application/json" \
  -d '{
    "outcome": "YES",
    "side": "sell",
    "tokenAmount": "5",
    "xrpAmountDrops": "8000000",
    "userAddress": "rUserAddress..."
  }'
```

**Response:**
```json
{
  "data": {
    "offer": { /* XRPL OfferCreate tx to sign */ }
  }
}
```

### View Trades

```bash
curl http://localhost:3001/api/markets/mkt_abc123/trades
```

---

## 5. Close Market

Stop accepting bets before resolution:

```bash
curl -X POST http://localhost:3001/api/markets/mkt_abc123/close \
  -H "X-Admin-Key: $ADMIN_KEY"
```

**Response:**
```json
{
  "data": {
    "id": "mkt_abc123",
    "status": "Closed"
  }
}
```

---

## 6. Resolve Market

Declare the winning outcome (requires multi-sign in production):

```bash
curl -X POST http://localhost:3001/api/markets/mkt_abc123/resolve \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: $ADMIN_KEY" \
  -d '{
    "outcomeId": "out_1"
  }'
```

**Response:**
```json
{
  "data": {
    "id": "mkt_abc123",
    "status": "Resolved",
    "resolvedOutcomeId": "out_1"
  }
}
```

---

## 7. Execute Payouts

Generate payout transactions for winners:

```bash
curl -X POST http://localhost:3001/api/markets/mkt_abc123/payouts \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: $ADMIN_KEY" \
  -d '{
    "batchSize": 50
  }'
```

**Response:**
```json
{
  "data": {
    "payouts": [
      {
        "id": "pay_1",
        "userId": "rWinnerAddress...",
        "amountDrops": "25000000",
        "payoutTx": { /* Payment tx to sign and submit */ }
      }
    ],
    "count": 3
  }
}
```

### Confirm Each Payout

After signing and submitting each payout tx:

```bash
curl -X POST http://localhost:3001/api/markets/mkt_abc123/payouts/confirm \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: $ADMIN_KEY" \
  -d '{
    "payoutId": "pay_1",
    "txHash": "PAYOUT_TX_HASH..."
  }'
```

### View Payout Status

```bash
curl http://localhost:3001/api/markets/mkt_abc123/payouts
```

---

## Demo Script (3 Minutes)

### Opening (0:00 - 0:20)

> "MITATE is a prediction market powered entirely by XRPL. It uses 6 native XRPL features — no smart contracts, pure XRPL."

**Show:** Homepage with multi-outcome markets

---

### Connect & Bet (0:20 - 1:00)

> "Let's bet on the Miyagi governor election. Four candidates — I'll bet 10 XRP on the incumbent."

**Actions:**
1. Connect GemWallet
2. Select market → Select outcome → Enter amount
3. Sign transaction in GemWallet

> "My bet is locked in XRPL Escrow. I received outcome tokens representing my position."

---

### Show XRPL Features (1:00 - 2:00)

> "Six XRPL features power this:"

1. **Escrow** — "Bets locked with time-based deadline"
2. **Issued Currency** — "Each outcome has its own token"
3. **Trust Lines** — "Users opt-in to hold outcome tokens"
4. **DEX** — "Trade positions before resolution"
5. **Multi-Sign** — "Resolution requires committee approval"
6. **Memo** — "All transactions carry audit data"

**Show:** Transaction on XRPL Explorer with Memo field

---

### Resolution & Payout (2:00 - 2:50)

> "When the election ends, the multi-sign committee declares the winner. Winners share the pool proportionally — parimutuel, like horse racing."

**Show:** Portfolio page with positions

---

### Closing (2:50 - 3:00)

> "MITATE proves XRPL's native primitives can power a complete prediction market — all verifiable on-chain."

---

## XRPL Features Summary

| Feature | How MITATE Uses It |
|---------|-------------------|
| **Escrow** | Time-locked XRP pool for bets |
| **Issued Currency** | Outcome tokens (multi-outcome supported) |
| **Trust Line** | Required to hold outcome tokens |
| **DEX** | Secondary trading of positions |
| **Multi-Sign** | Resolution governance |
| **Memo** | Structured audit trail |

---

## Troubleshooting

### Market Stuck in Draft
- Sign the `escrowTx` returned from POST /markets
- Call POST /markets/:id/confirm with the tx hash

### "Cannot resolve market" Error
- Market must be "Closed" first
- Call POST /markets/:id/close before resolving

### Payouts Not Working
- Market must be "Resolved" first
- Check operator wallet has enough XRP for payouts

---

## Backup Plan

If live demo fails:
1. **Show code** — `apps/api/src/xrpl/tx-builder.ts`
2. **Show pre-recorded video**
3. **Walk through ADR.md** — Architecture decisions
