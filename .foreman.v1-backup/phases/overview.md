# Phase Overview

## Phases (In Order)
1. Foundation & Setup
2. XRPL Core Integration
3. Market Lifecycle
4. Trading & Resolution
5. Frontend Integration
6. Polish & Demo Prep

## Dependencies
- 1 -> 2: monorepo + backend scaffold + XRPL client + DB schema are prerequisites for core XRPL tx builders and ingestion.
- 2 -> 3: transaction builders, memo codec, and ledger ingestion required before market lifecycle flows.
- 3 -> 4: market creation/betting flows must exist before DEX trading and resolution/payouts.
- 4 -> 5: backend endpoints and realtime events needed before wiring frontend to real data.
- 5 -> 6: UI and core flows in place before end-to-end testing, documentation, and demo packaging.

## Rough Time Estimates (13-Day Hackathon)
- Phase 1: 2.5 days
- Phase 2: 2.5 days
- Phase 3: 2.5 days
- Phase 4: 2.0 days
- Phase 5: 2.0 days
- Phase 6: 1.5 days

Total: 13 days

## Notes
- Dates are based on current date February 11, 2026, with Demo Day February 24, 2026.
- Buffer is embedded in Phase 6 for polish, testing, and demo prep.
