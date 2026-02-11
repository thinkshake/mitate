# MITATE 見立て

> XRPL Parimutuel Prediction Market

**Demo Day: February 24, 2026** | [JFIIP Hackathon](https://jfiip.xrpl.org)

## Overview

MITATE is a prediction market DApp built on XRPL (XRP Ledger) using parimutuel betting mechanics. Users bet on binary outcomes (YES/NO) with XRP, and winners share the entire pool proportionally.

### What Makes MITATE Special?

- **XRPL-Native Design**: Uses 6 XRPL primitives (Escrow, Issued Currency, Trust Line, DEX, Multi-Sign, Memo)
- **Parimutuel Pricing**: No complex AMM math — simple pool-based payouts
- **Verifiable On-Chain**: All bets and outcomes recorded on XRPL ledger
- **Multi-Sign Resolution**: 2-of-3 governance prevents manipulation

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│                            Vercel                                │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Backend (Hono)                          │
│                      Fly.io + SQLite                             │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        XRPL Testnet                              │
│     Escrow │ Issued Currency │ Trust Line │ DEX │ Multi-Sign     │
└─────────────────────────────────────────────────────────────────┘
```

## XRPL Features Used

| Feature | Usage |
|---------|-------|
| **Escrow** | Pool XRP bets with time-locked release |
| **Issued Currency** | YES/NO outcome tokens per market |
| **Trust Line** | Users hold outcome tokens |
| **DEX** | Secondary trading of outcome tokens |
| **Multi-Sign** | 2-of-3 resolution governance |
| **Memo** | On-chain metadata for all transactions |

## User Flow

1. **Market Created** → Admin creates market with betting deadline
2. **Bets Placed** → Users bet XRP on YES or NO, receive outcome tokens
3. **Trading** → Users can trade tokens on XRPL DEX before deadline
4. **Resolution** → Multi-sign committee resolves outcome
5. **Payout** → Winners receive proportional share of pool

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React, Tailwind CSS, shadcn/ui |
| Backend | Hono, Bun, SQLite (WAL mode) |
| Blockchain | XRPL Testnet, xrpl.js |
| Deployment | Vercel (frontend), Fly.io (backend) |

## Development

### Prerequisites

- [Bun](https://bun.sh) 1.0+
- Node.js 20+ (for Next.js)
- XRPL Testnet accounts (operator, issuer)

### Option 1: Docker Compose (Recommended)

```bash
# Clone
git clone https://github.com/thinkshake/mitate.git
cd mitate

# Configure environment
cp .env.example .env
# Edit .env with XRPL addresses

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Option 2: Local Development

```bash
# Clone
git clone https://github.com/thinkshake/mitate.git
cd mitate

# Install dependencies
bun install

# Configure environment
cp apps/api/.env.example apps/api/.env
# Edit .env with XRPL addresses and API key

# Run database migrations
cd apps/api && bun run migrate

# Start development servers
bun run dev  # Starts both frontend and backend
```

### Environment Variables

**Backend (apps/api/.env)**
```
PORT=3001
DATABASE_PATH=./data/mitate.db
XRPL_RPC_URL=https://s.altnet.rippletest.net:51234
XRPL_WS_URL=wss://s.altnet.rippletest.net:51233
XRPL_OPERATOR_ADDRESS=rXXX...
XRPL_ISSUER_ADDRESS=rYYY...
ADMIN_API_KEY=your-secret-key
```

**Frontend (apps/web/.env.local)**
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## API Endpoints

### Markets
- `GET /api/markets` — List all markets
- `GET /api/markets/:id` — Market details
- `POST /api/markets` — Create market (admin)
- `POST /api/markets/:id/close` — Close market (admin)

### Betting
- `POST /api/markets/:id/bets` — Place bet (returns tx payloads)
- `POST /api/markets/:id/bets/confirm` — Confirm bet
- `GET /api/markets/:id/bets/preview` — Preview payout

### Trading
- `POST /api/markets/:id/offers` — Create DEX offer
- `GET /api/markets/:id/trades` — List trades

### Resolution
- `POST /api/markets/:id/resolve` — Resolve market (admin)
- `POST /api/markets/:id/payouts` — Execute payouts (admin)
- `GET /api/markets/:id/payouts` — List payouts

## Deployment

### Backend (Fly.io)

```bash
cd apps/api
fly launch
fly secrets set XRPL_OPERATOR_ADDRESS=rXXX...
fly secrets set XRPL_ISSUER_ADDRESS=rYYY...
fly secrets set ADMIN_API_KEY=your-secret-key
fly deploy
```

### Frontend (Vercel)

```bash
cd apps/web
vercel
# Set NEXT_PUBLIC_API_URL to your Fly.io URL
```

## Demo Script

See [docs/demo-script.md](docs/demo-script.md) for the 3-minute demo walkthrough.

## License

MIT

## Team

Built for JFIIP Hackathon 2026 by:
- [Shota](https://github.com/hitsuji-haneta) — Developer
- [Aston](https://github.com/aston-ai) — AI Assistant
