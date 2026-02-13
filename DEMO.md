# MITATE Demo Guide

**Hackathon:** JFIIP Demo Day — February 24, 2026  
**Duration:** 3 minutes  
**Audience:** Judges evaluating XRPL feature usage

---

## Quick Reference: Market Lifecycle

```
1. CREATE    POST /api/markets              → Draft status
2. OPEN      POST /api/markets/:id/test-open → Open status (accepts bets)
3. BET       POST /api/markets/:id/bets     → Users place bets
4. CLOSE     POST /api/markets/:id/close    → Closed status (no more bets)
5. RESOLVE   POST /api/markets/:id/resolve  → Resolved status (winner declared)
6. PAYOUT    POST /api/markets/:id/payouts  → Generate payout transactions
7. CONFIRM   POST /api/markets/:id/payouts/confirm → Confirm each payout
```

---

## Pre-Demo Setup

### 1. Configure Environment

Create `apps/api/.env`:
```bash
PORT=3001
NODE_ENV=development
DATABASE_PATH=/data/mitate.db
XRPL_RPC_URL=https://s.altnet.rippletest.net:51234
XRPL_WS_URL=wss://s.altnet.rippletest.net:51233
XRPL_NETWORK_ID=1

# Get from testnet faucet: https://faucet.altnet.rippletest.net/accounts
XRPL_OPERATOR_ADDRESS=rYourOperatorAddress...
XRPL_ISSUER_ADDRESS=rYourIssuerAddress...

ADMIN_API_KEY=your-secure-admin-key
```

### 2. Start Services

```bash
cd ~/dev/mitate
docker-compose up -d

# Verify
curl http://localhost:3001/health
```

### 3. Fund Wallets

Get testnet XRP for operator wallet:
```bash
curl -X POST https://faucet.altnet.rippletest.net/accounts
```

---

## Complete Flow: Admin UI + API

### Step 1: Create Market (Admin UI)

1. Go to `http://localhost:3000/admin`
2. Enter admin key → Login
3. Click "マーケット作成"
4. Fill form:
   - Title: 宮城県知事選挙の当選者予想
   - Description: 2026年の宮城県知事選挙の当選者を予測
   - Category: 政治
   - Deadline: (future date)
   - Outcomes: 村井嘉浩, 新人候補A, 新人候補B, その他
5. Click "作成"

### Step 2: Open Market (Admin UI)

Click "Test Open" button next to the Draft market.

### Step 3: Place Bets (User Flow)

1. Go to `http://localhost:3000`
2. Connect GemWallet (must be on Testnet)
3. Click a market → Select outcome → Enter amount
4. Click "予測する" → Sign in GemWallet

### Step 4: Close Market (Admin UI)

Click "Close" button next to the Open market.

### Step 5: Resolve Market (Admin UI)

1. Click "Resolve" button
2. Select winning outcome from dropdown
3. Confirm

### Step 6: Execute Payouts (API)

```bash
# Generate payout transactions
curl -X POST http://localhost:3001/api/markets/YOUR_MARKET_ID/payouts \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: YOUR_ADMIN_KEY" \
  -d '{"batchSize": 50}'
```

Response includes payout transactions to sign:
```json
{
  "data": {
    "payouts": [
      {
        "id": "pay_xxx",
        "userId": "rWinnerAddress...",
        "amountDrops": "15000000",
        "payoutTx": { /* Payment tx to sign */ }
      }
    ]
  }
}
```

### Step 7: Sign & Confirm Payouts

For each payout, sign the `payoutTx` with the operator wallet, then confirm:

```bash
curl -X POST http://localhost:3001/api/markets/YOUR_MARKET_ID/payouts/confirm \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: YOUR_ADMIN_KEY" \
  -d '{"payoutId": "pay_xxx", "txHash": "SIGNED_TX_HASH"}'
```

### Step 8: Check Payout Status

```bash
curl http://localhost:3001/api/markets/YOUR_MARKET_ID/payouts
```

---

## API Reference

### Markets

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/markets` | GET | List all markets |
| `/api/markets` | POST | Create market (admin) |
| `/api/markets/:id` | GET | Get market details |
| `/api/markets/:id/test-open` | POST | Open market for testing (admin) |
| `/api/markets/:id/fix-operator` | POST | Fix operator address (admin) |
| `/api/markets/:id/close` | POST | Close market (admin) |
| `/api/markets/:id/resolve` | POST | Resolve market (admin) |

### Bets

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/markets/:id/bets` | GET | List bets for market |
| `/api/markets/:id/bets` | POST | Place bet |
| `/api/markets/:id/bets/:betId/confirm` | POST | Confirm bet after signing |

### Payouts

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/markets/:id/payouts` | GET | List payouts for market |
| `/api/markets/:id/payouts` | POST | Generate payout transactions (admin) |
| `/api/markets/:id/payouts/confirm` | POST | Confirm payout after signing (admin) |

### Users

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users/:address/bets` | GET | List user's bets |
| `/api/users/:address/attributes` | GET | Get user attributes |
| `/balance/:address` | GET | Get XRP balance |

---

## Demo Script (3 Minutes)

### Opening (0:00 - 0:20)

> "MITATE is a prediction market powered entirely by XRPL. It uses 6 native XRPL features — no smart contracts, pure XRPL."

**Show:** Homepage with markets

---

### Connect & Bet (0:20 - 1:00)

> "Let's bet on the Miyagi governor election."

**Actions:**
1. Connect GemWallet
2. Select market → Select outcome → Enter 5 XRP
3. Sign transaction

> "My bet is recorded on XRPL with a memo containing the market and outcome."

---

### Show XRPL Features (1:00 - 2:00)

> "Six XRPL features power this:"

1. **Escrow** — "Bets locked with time-based deadline"
2. **Issued Currency** — "Each outcome has its own token"
3. **Trust Lines** — "Users opt-in to hold outcome tokens"
4. **DEX** — "Trade positions before resolution"
5. **Multi-Sign** — "Resolution requires committee approval"
6. **Memo** — "All transactions carry structured data"

**Show:** Transaction on XRPL Explorer

---

### Resolution (2:00 - 2:50)

> "When resolved, winners share the pool proportionally — parimutuel betting."

**Show:** Admin resolving market (if time permits)

---

### Closing (2:50 - 3:00)

> "MITATE proves XRPL's native primitives can power a complete prediction market — all verifiable on-chain."

---

## XRPL Features Summary

| Feature | Usage |
|---------|-------|
| **Escrow** | Time-locked XRP pool for bets |
| **Issued Currency** | Outcome tokens per market |
| **Trust Line** | Required to hold outcome tokens |
| **DEX** | Secondary trading of positions |
| **Multi-Sign** | Resolution governance |
| **Memo** | Structured audit trail on all transactions |

---

## Troubleshooting

### "temREDUNDANT" Error
- Payment going to self (operator == bettor)
- Fix: Ensure `XRPL_OPERATOR_ADDRESS` is set and different from user

### "LastLedgerSequence" Error
- Transaction expired before signing
- Fix: Try again quickly, or check network latency

### Market Stuck in Draft
- Run `POST /api/markets/:id/test-open` to open

### Operator Address Not Set
- Run `POST /api/markets/:id/fix-operator` to update

### No Payouts After Resolution
- Payouts must be explicitly executed via API
- Run `POST /api/markets/:id/payouts` then confirm each

---

## Files Reference

| File | Purpose |
|------|---------|
| `apps/api/.env` | API configuration |
| `apps/api/src/services/bets.ts` | Bet placement logic |
| `apps/api/src/services/payouts.ts` | Payout calculation |
| `apps/api/src/xrpl/tx-builder.ts` | XRPL transaction builders |
| `apps/web/app/admin/page.tsx` | Admin dashboard |
