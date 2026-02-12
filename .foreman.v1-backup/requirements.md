# MITATE — XRPL Parimutuel Prediction Market

## Overview

Prediction market DApp for the Japan Financial Infrastructure Innovation Program (JFIIP) hackathon. Demo Day: February 24, 2026.

## Problem Statement

Prediction markets provide valuable price signals for future events, but most implementations either:
- Require complex on-chain logic (AMM pricing) that doesn't fit XRPL's architecture
- Are generic implementations that could run on any chain (scoring disqualifier)

MITATE solves this by using XRPL-native primitives (Escrow, Issued Currency, DEX, Multi-Sign, Memo) to implement a parimutuel prediction market that deeply leverages XRPL's unique capabilities.

## Target Users

- Hackathon judges evaluating XRPL integration depth
- Users who want to bet on binary outcomes (YES/NO)
- Market creators who want to create prediction markets

## Scoring Alignment (Critical Context)

| Criteria | Weight | How MITATE Addresses It |
|---|---|---|
| XRPL Functions Used | 25% | 6 native features: Escrow, Issued Currency, Trust Line, DEX, Multi-Sign, Memo |
| Commercial Viability | 30% | Parimutuel is proven model (horse racing, sports betting) |
| Project Completeness | 25% | Working prototype with full bet→resolve→payout flow |
| Track Depth | 20% | Deep XRPL-native design, not portable to other chains |

## Core Features

### 1. Market Creation
- Create binary (YES/NO) prediction markets
- Set betting deadline (enforced via Escrow CancelAfter)
- Record market metadata in Memo fields
 - Create issuer-backed outcome tokens (Issued Currency) per market
 - Create market escrow(s) to hold XRP pool

#### XRPL Transaction Details (Market Creation)
**Account setup (one-time):**
- `AccountSet`
  - `Account`: `MARKET_OPERATOR_ADDRESS`
  - `SetFlag`: `asfDisableMaster` (optional, if using regular key)  
  - `SetFlag`: `asfDefaultRipple` (required for IOU transferability)
- `SignerListSet`
  - `Account`: `MARKET_OPERATOR_ADDRESS`
  - `SignerQuorum`: `2` (default; see Multi-Sign setup below)
  - `SignerEntries`: list of resolution signers and weights
- `AccountSet` (optional): set `RegularKey` for operational signing if desired

**Per-market:**
- `AccountSet` (issuer, optional): ensure `DefaultRipple` set for issuer if using separate issuer account
- `EscrowCreate` (one-time for market pool)
  - `Account`: `MARKET_OPERATOR_ADDRESS`
  - `Destination`: `MARKET_OPERATOR_ADDRESS` (self-escrow pool)
  - `Amount`: sum of all XRP bets for the market (escrows updated per bet; see flow)
  - `CancelAfter`: `betting_deadline_epoch`
  - `FinishAfter`: `resolution_time_epoch` (optional, if known)
  - `Condition`: omitted (if no crypto-condition is used)
  - `Memos`: market metadata (format below)
  - `DestinationTag`: market ID (optional but recommended)
  - `SourceTag`: market ID (optional but recommended)

**Issued Currency definition (per market, per outcome):**
- Token format:
  - `Currency`: 3-letter or 160-bit hex code  
    - If 3-letter: `YES` / `NO`  
    - If 160-bit: `YES` and `NO` prefixed with market ID, e.g. hex of `MITATE:<marketId>:YES`
  - `Issuer`: `MARKET_ISSUER_ADDRESS` (can be operator or dedicated issuer)
  - `Value`: numeric amount of outcome tokens (1 token = 1 XRP bet, or configurable ratio)

### 2. Betting Flow
- User places bet on YES or NO outcome
- XRP locked in Escrow (time-locked deposit)
- Outcome tokens (Issued Currency) minted to represent the bet
- Trust Line established for token holding

#### XRPL Transaction Details (Betting)
- `TrustSet`
  - `Account`: `USER_ADDRESS`
  - `LimitAmount`: `{ currency, issuer, value }` (set max outcome tokens user can hold)
  - `Memos`: `{ type: "bet", marketId, outcome }` (see Memo format)
- `Payment` (XRP bet amount from user to operator)
  - `Account`: `USER_ADDRESS`
  - `Destination`: `MARKET_OPERATOR_ADDRESS`
  - `Amount`: `bet_amount_drops`
  - `Memos`: `{ type: "bet", marketId, outcome }`
- `EscrowCreate` (operator locks funds per bet or aggregate)
  - `Account`: `MARKET_OPERATOR_ADDRESS`
  - `Destination`: `MARKET_OPERATOR_ADDRESS`
  - `Amount`: `bet_amount_drops` (or updated pool escrow)
  - `CancelAfter`: `betting_deadline_epoch`
  - `Memos`: `{ type: "escrow_pool", marketId }`
- `Payment` (mint outcome IOU to user from issuer)
  - `Account`: `MARKET_ISSUER_ADDRESS`
  - `Destination`: `USER_ADDRESS`
  - `Amount`: `{ currency, issuer, value: outcome_tokens }`
  - `Memos`: `{ type: "mint", marketId, outcome }`

### 3. Secondary Trading
- Outcome tokens tradable on XRPL DEX (OfferCreate)
- Peer-to-peer trading before market resolution

#### XRPL Transaction Details (Trading)
- `OfferCreate`
  - `Account`: `USER_ADDRESS`
  - `TakerGets`: `{ currency, issuer, value }` (outcome IOU to sell)
  - `TakerPays`: `XRP` or IOU (buy side asset)
  - `Expiration`: optional (set to betting deadline)
  - `Memos`: `{ type: "offer", marketId, outcome }`

**Note:** Offers should be blocked after betting deadline by UI and backend checks. Existing offers may still exist on-ledger; resolution flow must ignore any trades after deadline if they occur.

### 4. Resolution & Payout
- Multi-Sign governance for market resolution (prevents single-point manipulation)
- Parimutuel payout calculation: `totalPool × betAmount / Σ(betAmounts for winning outcome)`
- Payment transactions to winning token holders

#### XRPL Transaction Details (Resolution & Payout)
- `EscrowFinish` (release pooled XRP for payout)
  - `Account`: `MARKET_OPERATOR_ADDRESS` (multi-signed)
  - `Owner`: `MARKET_OPERATOR_ADDRESS`
  - `OfferSequence`: escrow sequence (per escrow)
  - `Memos`: `{ type: "resolve", marketId, outcome }`
  - `Condition` / `Fulfillment`: only if crypto-conditions used
- `EscrowCancel` (if market invalidated, refunds pool)
  - `Account`: `MARKET_OPERATOR_ADDRESS` (multi-signed)
  - `Owner`: `MARKET_OPERATOR_ADDRESS`
  - `OfferSequence`: escrow sequence
  - `Memos`: `{ type: "cancel", marketId }`
- `Payment` (payout to each winner)
  - `Account`: `MARKET_OPERATOR_ADDRESS`
  - `Destination`: `WINNER_ADDRESS`
  - `Amount`: `payout_drops`
  - `Memos`: `{ type: "payout", marketId, outcome }`
- `Payment` (burn outcome tokens by sending back to issuer)
  - `Account`: `USER_ADDRESS`
  - `Destination`: `MARKET_ISSUER_ADDRESS`
  - `Amount`: `{ currency, issuer, value }`
  - `Memos`: `{ type: "burn", marketId, outcome }`
  - **Note:** token burn can be required for payout eligibility or used for accounting only. Decide before implementation.

## Non-Goals (Hackathon Scope)

- Bet weighting (future feature, architecture supports it)
- Yield integration on locked funds (future feature)
- Stablecoin settlement (Escrow only supports XRP)
- Mobile app (web only)

## Technical Constraints

1. **XRPL Testnet only** — no mainnet deployment
2. **XRP-only settlement** — Escrow protocol limitation
3. **Off-chain payout calculation** — XRPL has no on-chain compute for ratio math
4. **Demo video max 3 minutes**
5. **Public GitHub repository required**

## Architecture Decisions (from ADR)

### Pricing: Parimutuel (not LMSR)
- XRPL has no on-chain compute for `b * ln(Σe^(q_i/b))`
- Parimutuel is simple ratio arithmetic, works with off-chain calculation
- All inputs publicly verifiable on-ledger

### Execution: XRPL L1 Native (not EVM Sidechain)
- Maximizes "XRPL Functions Used" score
- Demonstrates deep XRPL knowledge
- Not portable to other chains (differentiator)

### Settlement: XRP (not Stablecoin)
- Required for Escrow usage
- Testnet faucet availability
- Stablecoin support noted as future work

## On-chain vs Off-chain Responsibilities

### On-chain (XRPL L1)
| Function | XRPL Feature |
|---|---|
| Fund pool management | Escrow |
| Bet recording | Issued Currency (Trust Line) |
| Deadline enforcement | Escrow CancelAfter |
| Secondary trading | DEX (OfferCreate) |
| Resolution governance | Multi-Sign |
| Metadata recording | Memo |

### Off-chain (Server)
| Function | Description |
|---|---|
| Payout calculation | `totalPool × betAmount / Σ(betAmounts for winning outcome)` |
| Payout execution | Payment transactions to winners |
| Token holder queries | via `account_lines` API |
| Market management | Frontend + Backend |

## XRPL Integration Details (Expanded)

### Transaction Types & Required Fields
**Primary types used:**
- `EscrowCreate`, `EscrowFinish`, `EscrowCancel`
- `Payment` (XRP + IOU)
- `TrustSet`
- `OfferCreate` (DEX)
- `SignerListSet`, `AccountSet`
- `AccountInfo` / `AccountLines` for reads (RPC)

**Memos format (all txs):**
- `MemoType`: `MITATE` (hex-encoded ASCII)
- `MemoFormat`: `application/json` (hex-encoded ASCII)
- `MemoData`: JSON string (hex-encoded)
  - Base fields:
    - `v`: `1`
    - `type`: `market|bet|mint|offer|resolve|payout|cancel|escrow_pool`
    - `marketId`: string
    - `outcome`: `YES|NO` (if applicable)
    - `amount`: string numeric (if applicable)
    - `creator`: account (for market creation)
    - `timestamp`: ISO8601

**Issued Currency naming/structure:**
- `Currency` options:
  - 3-letter codes: `YES` / `NO` (simple, but ambiguous across markets)
  - 160-bit hex code: `MITATE:<marketId>:YES` / `MITATE:<marketId>:NO`
- **Recommendation:** use 160-bit hex code to avoid collisions and enable multiple markets simultaneously.
- `Issuer`: dedicated issuer account to isolate risk and simplify clawbacks if needed.

### Escrow Flow (Exact Fields)
**Create (per bet or per market pool):**
- `EscrowCreate`
  - `Account`: operator
  - `Destination`: operator (self-escrow) OR controlled escrow account
  - `Amount`: XRP in drops
  - `CancelAfter`: betting deadline (epoch)
  - `FinishAfter`: resolution time (epoch) if known; optional
  - `Memos`: `type=escrow_pool`, `marketId`
  - `DestinationTag`: `marketId` (optional)
  - `SourceTag`: `marketId` (optional)

**Finish (release to payouts):**
- `EscrowFinish`
  - `Account`: operator (multi-signed)
  - `Owner`: operator
  - `OfferSequence`: escrow sequence
  - `Condition` / `Fulfillment`: only if used
  - `Memos`: `type=resolve`, `marketId`, `outcome`

**Cancel (refund):**
- `EscrowCancel`
  - `Account`: operator (multi-signed)
  - `Owner`: operator
  - `OfferSequence`: escrow sequence
  - `Memos`: `type=cancel`, `marketId`

### Multi-Sign Setup (Resolution Governance)
**Recommended default (adjustable):**
- `SignerListSet`
  - `SignerQuorum`: `2`
  - `SignerEntries`: 3 signers with weight 1 each
- **Threshold:** 2-of-3 required for resolution transactions (`EscrowFinish`, `EscrowCancel`, and payout `Payment`).
- **Who signs:** operator + 2 neutral signers (e.g., hackathon mentors or judges).
- **Open Question:** whether to allow emergency single-signer cancel after `CancelAfter`.

## User Flows

### Flow: Create Market → Place Bet → Trade → Resolve → Claim
1. **Create market**
  - User submits market details (title, description, deadline, resolution criteria).
  - Backend creates market record in SQLite with `status=Draft`.
  - Backend submits XRPL txs:
    - Ensure issuer and operator account settings.
    - Create initial escrow (empty or 1 drop for linkage).
  - Market transitions to `Open` after success.
2. **Place bet**
  - User connects wallet and chooses outcome.
  - Frontend prepares `TrustSet` if no trust line.
  - User signs `Payment` of XRP bet to operator.
  - Backend observes tx, creates escrow entry, mints outcome token to user.
  - Market remains `Open` until deadline.
3. **Trade**
  - User creates `OfferCreate` to sell/buy YES/NO.
  - DEX matches offers; backend records trade events from ledger.
4. **Resolve**
  - After deadline, resolution committee signs `EscrowFinish` (or `EscrowCancel`).
  - Backend computes payout ratios off-chain and prepares payouts.
  - Market transitions to `Resolved`.
5. **Claim**
  - Winners claim by signing a `Payment` to burn outcome tokens (if required).
  - Backend sends XRP payout and records final `Paid` state.

### Wallet Connection Flow (Xaman/GemWallet/etc.)
1. User selects wallet provider.
2. Frontend detects provider and connects (e.g., `xumm` or `gemwallet` SDK).
3. User approves account access.
4. Frontend validates network = XRPL Testnet.
5. Store `userWallet` association in SQLite.

### Error States & Edge Cases
- **Bet after deadline:** reject client-side and server-side; do not mint tokens.
- **Escrow create failure:** refund user payment or queue retry; mark bet `Failed`.
- **Trust line missing or limit too low:** instruct user to set/raise trust line.
- **Offer remains after deadline:** ignore for payout calculations.
- **Resolution dispute:** require multi-sign threshold; if no quorum, market remains `Stalled`.
- **Issuer account lacks reserve:** cannot mint IOU; error and alert admin.
- **Wallet on wrong network:** show error and block actions.

## Data Model (Expanded)

### Persistence: SQLite vs On-Chain
**SQLite:**
- `markets` (metadata, deadlines, status, resolution outcome, escrow sequences)
- `bets` (user, amount, outcome, related tx hashes)
- `escrows` (sequence, status, amounts, cancel/finish hashes)
- `trades` (offer tx hash, matched trades)
- `users` (wallet address, provider, created_at)
- `payouts` (user, amount, status, tx hash)

**On-chain:**
- Escrows for pooled funds
- IOU balances for YES/NO holdings
- DEX offers and trades
- Memo metadata (market, bet, payout identifiers)

### Market States & Transitions
- `Draft` → `Open` (market created on-chain)
- `Open` → `Closed` (betting deadline reached)
- `Closed` → `Resolved` (outcome decided and escrow finished)
- `Resolved` → `Paid` (all payouts complete)
- `Open/Closed` → `Canceled` (escrow canceled/refunds)
- `Closed` → `Stalled` (no multi-sign quorum by resolution deadline)

### User/Wallet Associations
- Single user can link multiple wallet providers.
- `users` table keyed by wallet address; store provider type (`xaman`, `gemwallet`).
- Ensure uniqueness per wallet address; allow soft link to multiple login methods.

## API Contracts (Draft)

### Markets
- `GET /markets` → list markets
- `GET /markets/:id` → market details + on-chain status
- `POST /markets` → create market (admin)
- `PATCH /markets/:id` → update market metadata (admin only)
- `POST /markets/:id/close` → mark market closed (admin)

### Betting & Trading
- `POST /markets/:id/bets` → create bet intent (returns XRPL tx payload)
- `POST /markets/:id/bets/confirm` → confirm bet tx hash and mint tokens
- `POST /markets/:id/offers` → create offer intent (returns XRPL tx payload)

### Resolution & Payout
- `POST /markets/:id/resolve` → submit resolution outcome (multi-sig trigger)
- `POST /markets/:id/payouts` → execute payouts (admin)
- `GET /markets/:id/payouts` → list payouts

### Wallets
- `POST /wallet/connect` → associate wallet with user
- `GET /wallet/:address` → user profile and balances

### XRPL Webhooks / Subscriptions
- Subscribe to:
  - `account_tx` for operator and issuer accounts
  - `ledger` close events to detect deadline crossings
  - `account_lines` changes for token balances
- Webhook events:
  - `BetPaymentConfirmed`
  - `EscrowCreated`
  - `OfferMatched`
  - `ResolutionSigned`
  - `PayoutSent`

## Gaps / Questions (Open)
- Should bet escrow be per-bet or a single pooled escrow updated per bet?
- Should payout require token burn, or is holding token sufficient for payout eligibility?
- What is the exact resolution time vs betting deadline? Is there a fixed resolution window?
- Who are the multi-sign signers (names/addresses) for demo?
- Token naming: use 3-letter `YES/NO` or 160-bit hex code?
- Do we allow market creators other than the operator during demo?
- Should we support refunds if escrow create fails after bet payment?

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), Vercel |
| Backend | Node.js / TypeScript (Hono), Fly.io |
| Database | SQLite (Fly.io Volume) |
| Blockchain | XRPL Testnet |
| XRPL SDK | xrpl.js |

## Existing Assets

- UI prototype exists at `app/` with:
  - Homepage, Markets listing, Market detail, Portfolio, Activity, Learn pages
  - shadcn/ui components
  - Mock data structure
- Need to update UI to reflect actual XRPL integration

## Success Criteria

1. **Working demo**: Full bet → resolve → payout flow on XRPL Testnet
2. **6 XRPL features**: Escrow, Issued Currency, Trust Line, DEX, Multi-Sign, Memo
3. **Verifiable**: All on-chain data independently checkable
4. **Documented**: Clear architecture, ADR, and README
5. **Deployable**: Live on Vercel + Fly.io for demo day

## Timeline

- Demo Day: February 24, 2026
- ~13 days from now
