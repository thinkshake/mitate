# MITATE UI Migration Requirements

## Background

MITATE is an XRPL-powered prediction market for the JFIIP hackathon (demo day: Feb 24, 2026). The initial implementation is complete with:
- Backend API (Hono + SQLite + xrpl.js)
- XRPL integration (Escrow, Issued Currency, Trust Lines, DEX, Multi-Sign, Memo)
- Basic frontend (apps/web) with GemWallet integration

A team member created a new UI design in `apps/mock/` with superior design and new features. This migration integrates that UI with our existing backend while adding new capabilities.

## Goals

1. Replace `apps/web` with the new UI from `apps/mock/`
2. Add multi-outcome market support (not just YES/NO)
3. Implement weighted betting system (user attributes affect bet weight)
4. Integrate with existing XRPL backend
5. Keep Japanese UI language
6. Use XRP as currency (not JPYC from mock)

## Non-Goals

- Admin panel UI (use API/CLI for market management)
- Mobile app
- Mainnet deployment (Testnet only for hackathon)
- JPYC or other stablecoins

## Features to Migrate from apps/mock

### UI Components
- Site header with wallet connection
- Market listing page with filter bar (category, status)
- Market detail page with outcomes list
- Bet panel with amount input and quick select
- My Page (portfolio with positions)
- Market card component with category badges

### New Features to Implement
1. **Multi-Outcome Markets** — Support 2-5 outcomes per market (not just YES/NO)
2. **Weighted Betting** — User attributes (region, expertise, experience) multiply bet effectiveness
3. **Attribute System** — Users can register verified attributes that grant weight bonuses
4. **Category System** — Markets belong to categories (政治, 経済, 地域, etc.)

## Technical Constraints

- Keep bun as package manager
- Keep GemWallet as wallet (no other wallets)
- Keep XRP as currency (convert JPYC references)
- Keep existing API structure in apps/api
- Must work with existing XRPL transaction builders

## API Changes Required

### Markets
- Add `outcomes` field (array of {id, label, probability})
- Add `category` and `categoryLabel` fields
- Change from hardcoded YES/NO to dynamic outcomes

### Users/Attributes
- New endpoint: GET/POST /users/:address/attributes
- Store verified attributes per wallet address
- Calculate weight score from attributes

### Bets
- Update to reference outcome ID (not just "YES"/"NO")
- Store weight multiplier applied at bet time
- Calculate effective amount (amount × weight)

## Acceptance Criteria

1. Homepage shows market list with category filter
2. Market detail shows all outcomes with probabilities
3. Users can connect GemWallet and see their address
4. Users can place bets on any outcome with XRP
5. Bet amounts are multiplied by user's weight score
6. Portfolio page shows user's positions
7. All XRPL transactions work (escrow, tokens, etc.)

## Tech Stack

- Frontend: Next.js 14+ (App Router), Tailwind CSS, shadcn/ui
- Backend: Hono, SQLite, xrpl.js
- Wallet: GemWallet (@gemwallet/api)
- XRPL: Testnet
