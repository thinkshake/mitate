# MITATE Demo Guide

**Hackathon:** JFIIP Demo Day — February 24, 2026  
**Duration:** 3 minutes  
**Audience:** Judges evaluating XRPL feature usage

---

## Pre-Demo Setup (Day Before)

### 1. Install GemWallet Browser Extension

Download from: https://gemwallet.app/

- Install the Chrome/Firefox extension
- Create a new wallet or import existing
- **Switch to XRPL Testnet** in settings

### 2. Fund Your Testnet Wallet

Get free testnet XRP from the faucet:
```
https://faucet.altnet.rippletest.net/accounts
```

You need ~100 XRP minimum (50 for reserve + betting funds).

### 3. Start Local Services

```bash
cd ~/dev/mitate

# Start with Docker (recommended)
docker-compose up -d

# Or start manually:
cd apps/api && bun run dev &
cd apps/web && bun run dev &
```

Verify services:
- API: http://localhost:3001/health
- Web: http://localhost:3000

### 4. Create Demo Markets

Use the API to seed markets:

```bash
# Market 1: Bitcoin price prediction
curl -X POST http://localhost:3001/markets \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Will Bitcoin reach $100K by March 2026?",
    "description": "Resolves YES if BTC/USD reaches $100,000 on any major exchange before March 31, 2026.",
    "category": "crypto",
    "bettingDeadline": "2026-03-30T23:59:59Z",
    "resolutionTime": "2026-03-31T12:00:00Z"
  }'

# Market 2: Sports event
curl -X POST http://localhost:3001/markets \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Will Japan win the 2026 World Cup?",
    "description": "Resolves YES if Japan wins the FIFA World Cup 2026.",
    "category": "sports",
    "bettingDeadline": "2026-07-19T00:00:00Z",
    "resolutionTime": "2026-07-19T23:59:59Z"
  }'

# Market 3: Tech prediction (good for demo - near deadline)
curl -X POST http://localhost:3001/markets \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Will GPT-5 launch before April 2026?",
    "description": "Resolves YES if OpenAI releases GPT-5 to the public before April 1, 2026.",
    "category": "tech",
    "bettingDeadline": "2026-03-31T23:59:59Z",
    "resolutionTime": "2026-04-01T12:00:00Z"
  }'
```

### 5. Pre-Place Some Bets (Optional)

Place a few bets from a secondary wallet to show existing market activity.

---

## Demo Script (3 Minutes)

### Opening (0:00 - 0:20)

**Say:**
> "MITATE is a prediction market powered entirely by XRPL. It uses 6 native XRPL features to create a trustless betting platform — no smart contracts, no EVM sidechain, pure XRPL."

**Show:** Homepage with market listings

---

### Connect Wallet (0:20 - 0:40)

**Say:**
> "First, let me connect my wallet."

**Action:**
1. Click **Connect Wallet** button in header
2. GemWallet popup appears → Click **Connect**
3. Show connected address in header

**Say:**
> "I'm using GemWallet connected to XRPL Testnet. My address is now shown in the header."

---

### Select Market & Place Bet (0:40 - 1:20)

**Say:**
> "Let's bet on whether Bitcoin will hit $100K. The current odds show 65% YES — meaning the market thinks it's likely."

**Action:**
1. Click on the Bitcoin market card
2. Show the market detail page with:
   - Current odds (YES vs NO percentages)
   - Total pool size
   - Recent bets list

**Say:**
> "I'll bet 10 XRP on YES."

**Action:**
1. Enter `10` in the amount field
2. Select `YES` outcome
3. Click **Place Bet**
4. GemWallet popup appears → Review transaction → **Sign**

**Say:**
> "GemWallet shows me exactly what I'm signing — a Payment transaction to the escrow pool with MITATE memo data."

**After signing:**
> "Done! My bet is now locked in XRPL Escrow and I received YES tokens representing my position."

---

### Show On-Chain Verification (1:20 - 1:50)

**Say:**
> "Everything is verifiable on-chain. Let me show you."

**Action:**
1. Click the transaction hash link
2. XRPL Explorer opens showing the transaction
3. Point out the **Memo** field with MITATE data

**Say:**
> "See this memo? It contains the market ID and outcome I bet on. Anyone can verify this transaction on the XRPL ledger."

---

### XRPL Features Overview (1:50 - 2:30)

**Say:**
> "Let me quickly highlight the 6 XRPL features we use:"

Show each as you mention:

1. **Escrow** — "All bets are locked in time-locked escrow until market resolution"
2. **Issued Currency** — "YES and NO tokens are XRPL issued currencies"
3. **Trust Lines** — "Users establish trust lines to hold outcome tokens"
4. **DEX** — "Tokens can be traded on XRPL's native DEX before resolution"
5. **Multi-Sign** — "Market resolution requires 2-of-3 signatures to prevent manipulation"
6. **Memo** — "Every transaction carries structured memo data for transparency"

---

### Resolution & Payout (2:30 - 2:50)

**Say:**
> "When the market resolves, the multi-sign committee submits the outcome. Winners share the entire pool proportionally — a parimutuel system, like horse racing."

**Show:** Portfolio page with bet history (if you pre-placed bets)

**Say:**
> "If I bet 10 XRP and the total YES pool is 100 XRP, I own 10% of winning payouts."

---

### Closing (2:50 - 3:00)

**Say:**
> "MITATE shows that XRPL's unique primitives — Escrow, Issued Currency, Trust Lines, DEX, Multi-Sign, and Memos — can power a complete prediction market with no smart contracts. All data is on-chain, all transactions are verifiable."

**Show:** GitHub repo URL

---

## Key Points to Emphasize

| Feature | How MITATE Uses It |
|---------|-------------------|
| **Escrow** | Locks bet funds with time-based release |
| **Issued Currency** | YES/NO outcome tokens per market |
| **Trust Line** | Required to hold outcome tokens |
| **DEX** | Secondary trading of positions |
| **Multi-Sign** | 2-of-3 resolution committee |
| **Memo** | Structured data in every transaction |

---

## Troubleshooting

### GemWallet Not Detected
- Refresh the page after installing
- Make sure you're on Chrome/Firefox (not Safari)
- Check that the extension is enabled

### "Wrong Network" Error
- Open GemWallet settings
- Switch from Mainnet to **Testnet**
- Reconnect wallet

### Transaction Fails
- Check you have enough XRP (10+ reserve + bet amount)
- Refresh and try again
- Check API logs: `docker-compose logs api`

### Markets Not Loading
- Verify API is running: `curl http://localhost:3001/health`
- Check CORS settings in API config
- Look for errors in browser console

---

## Backup Plan

If live demo fails:

1. **Show code walkthrough** — Open `apps/api/src/xrpl/tx-builder.ts` and explain transaction construction
2. **Show pre-recorded video** — Have a screen recording of the happy path ready
3. **Walk through architecture** — Use the ADR.md document to explain design decisions

---

## Files to Have Open

Keep these tabs ready:

1. http://localhost:3000 — MITATE frontend
2. https://testnet.xrpl.org — XRPL Explorer
3. `~/dev/mitate/docs/ADR.md` — Architecture decisions
4. GemWallet extension popup

---

## Demo Checklist

Before going on stage:

- [ ] Docker services running (`docker-compose ps`)
- [ ] GemWallet installed and on Testnet
- [ ] Wallet funded with 100+ testnet XRP
- [ ] Demo markets created
- [ ] Browser tabs arranged
- [ ] Screen sharing tested
- [ ] Backup video ready
