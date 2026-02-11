# ADR: XRPL Parimutuel Prediction Market

## Status
Accepted — 2025-02-11

## Context
Architecture decisions for a prediction market DApp submitted to the Japan Financial Infrastructure Innovation Program (JFIIP) hackathon. Hosted by Ripple × Web3 Salon × JETRO. Demo Day: February 24, 2026 (Japan FinTech Week).

### Scoring Criteria
| Criteria | Weight |
|---|---|
| XRPL Functions Used (depth, creativity, sophistication of integration) | 25% |
| Commercial Viability (market need, business model, scalability) | 30% |
| Project Completeness (working prototype, documentation quality) | 25% |
| Track Depth (domain expertise, track relevance) | 20% |

### Constraints
- Must work on XRPL Testnet
- Demo video: max 3 minutes
- Public GitHub repository required
- Heavy use of XRPL-native features is critical ("Generic project that works on any chain" is an explicit disqualifier)

---

## Decision 1: Pricing Mechanism — Parimutuel

### Options Considered
1. LMSR (Logarithmic Market Scoring Rule) AMM
2. **Parimutuel** ← selected

### Rationale
- **XRPL L1 compatibility**: Parimutuel requires no real-time pricing function on-chain. LMSR requires `b * ln(Σe^(q_i/b))` computations, which XRPL has no mechanism to execute on-chain.
- **Bet weighting compatibility**: Parimutuel integrates weight coefficients naturally by multiplying in the payout formula. LMSR creates contradictions — different users would have different price impacts for the same purchase quantity, breaking fair price discovery and creating arbitrage opportunities.
- **Implementation complexity**: Parimutuel is simple ratio arithmetic. Achievable within the hackathon timeline with high confidence.
- **Scoring alignment**: Higher proportion of logic lives on-chain, maximizing the "XRPL Functions Used" score.

### Why LMSR Was Rejected
- Core logic (pricing) would live off-chain, weakening the "XRPL Functions Used" score
- Bet weighting integration is architecturally problematic (per-user price impact asymmetry)
- Higher implementation risk for hackathon timeline

---

## Decision 2: Execution Layer — XRPL L1 Native + Off-chain Server

### Options Considered
1. **XRPL L1 native features + off-chain server** ← selected
2. XRPL EVM Sidechain (Solidity)

### Rationale
- **XRPL Functions Used (25%)**: L1 native enables Escrow, Issued Currency, DEX, Multi-Sign, Memo — 5+ XRPL-specific features. EVM Sidechain produces Solidity contracts portable to Ethereum/Polygon/Arbitrum, weakening the "why XRPL?" argument.
- **Project Completeness (25%)**: xrpl.js alone is sufficient. No bridge configuration or Solidity toolchain required.
- **Track Depth (20%)**: Demonstrates deep understanding of XRPL-native primitives.

### Why EVM Sidechain Was Rejected
- Scoring guidelines explicitly flag "Generic project (works on any chain)" as a pitfall
- Additional complexity (Solidity + Hardhat + bridge setup) without scoring benefit
- Risk of being perceived as "not truly XRPL-native"

---

## Decision 3: Settlement Currency — XRP

### Options Considered
1. **XRP** ← selected
2. Stablecoin (Issued Currency)

### Rationale
- **Escrow compatibility**: XRPL Escrow can only lock XRP. Issued Currencies cannot be escrowed — this is a protocol-level constraint.
- **Scoring**: Escrow usage is a strong differentiator for "XRPL Functions Used".
- **Testnet simplicity**: XRP is freely available from the faucet. Stablecoins would require self-issuance, adding setup overhead.

### Trade-off
- Stablecoin support is desirable for production. This is acknowledged as a future extension and will be mentioned in documentation and demo narrative.

---

## Decision 4: On-chain / Off-chain Responsibility Split

### On-chain (XRPL L1)
| Function | XRPL Feature | Purpose |
|---|---|---|
| Fund pool management | **Escrow** | Time-locked XRP deposit for bets |
| Bet recording | **Issued Currency (Trust Line)** | YES/NO outcome token issuance |
| Betting deadline enforcement | **Escrow CancelAfter** | Automatic deadline via time-lock |
| Secondary trading | **DEX (OfferCreate)** | Peer-to-peer outcome token trading |
| Resolution governance | **Multi-Sign** | Multi-party market resolution approval |
| Metadata recording | **Memo** | On-ledger bet/market state recording |

### Off-chain (Server)
| Function | Description |
|---|---|
| Payout calculation | `totalPool × (betAmount × weight) / Σ(betAmount_i × weight_i)` |
| Payout transaction submission | Individual Payment to each winner |
| Token holder aggregation | Query via XRPL API (`account_lines`) |
| Market management UI | Frontend / Backend |
| User attributes & weight management | Off-chain database |

### Trust Guarantees
- All payout calculation inputs (total pool, individual balances) are publicly visible on-ledger, enabling independent post-hoc verification by anyone.
- Market state hashes recorded in Memo fields enable off-chain computation integrity checks.

---

## Decision 5: Differentiation Features

### In Scope (Hackathon)
1. **Parimutuel prediction market core** — Full bet → resolve → payout flow using XRPL native features.

### Concept Only (Future Roadmap)
1. **Bet weighting**: Attribute-based weight coefficients in payout calculation. Naturally integrates with Parimutuel: `payout = totalPool × (bet × w) / Σ(bet_i × w_i)`.
2. **Yield integration on deposits**: Redirect locked funds to XRPL DeFi protocols (e.g., AMM liquidity provision) to eliminate opportunity cost. Requires architectural change from Escrow to operator-managed pooling.

---

## Decision 6: Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), deployed on Vercel |
| Backend | Node.js / TypeScript (Express or Hono), deployed on Fly.io |
| Database | SQLite (file-based, persisted on Fly.io Volume) |
| Blockchain | XRPL Testnet |
| XRPL SDK | xrpl.js |

### Why Fly.io + SQLite
- Full Node.js runtime with no execution time limits — WebSocket connections to XRPL and long-running operations (e.g., batch EscrowFinish) work without constraints
- Persistent Volumes allow SQLite file storage with zero external DB dependencies
- Free tier ($5/month credit) is sufficient for hackathon scale
- Deploy via CLI (`fly launch` / `fly deploy`) with automatic Dockerfile generation — minimal ops overhead
- No V8 isolate restrictions — xrpl.js and crypto libraries (e.g., `five-bells-condition`) work out of the box with Node.js `crypto` module

---

## Consequences

### Positive
- 5+ XRPL-specific features utilized, maximizing "XRPL Functions Used" score
- Parimutuel simplicity ensures completion within hackathon timeline
- Clear extension path to bet weighting and yield integration
- Off-chain payout computation is fully verifiable against on-ledger data
- Full Node.js runtime on Fly.io eliminates platform compatibility concerns with xrpl.js and crypto libraries

### Negative
- Parimutuel lacks real-time price movement (partially compensated by secondary DEX trading)
- XRP-only settlement due to Escrow constraint (stablecoin support requires architectural change)
- Payout distribution requires trust in the off-chain server (not fully trustless)
