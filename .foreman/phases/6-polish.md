# Phase 6 - Polish & Demo Prep

## Scope and Deliverables
- End-to-end testing of critical flows.
- Documentation updates (README, architecture notes, runbook).
- Demo script and short demo video preparation.
- Final deployment checks for Vercel and Fly.io.

## Dependencies
- Phase 5 complete: frontend integration with real data and XRPL flows.

## Acceptance Criteria
- Full create -> bet -> resolve -> payout flow tested on XRPL Testnet.
- Docs explain setup, architecture, and XRPL feature usage.
- Demo script is rehearsable and under 3 minutes.
- Deployments succeed with environment configuration documented.

## Implementation Notes
- Prioritize reliability and graceful error handling over new features.
- Use seeded test markets for demo to reduce risk.
- Validate admin resolution flow with multi-sign in advance.

## Files to Create/Modify
- `README.md`
- `docs/demo-script.md`
- `docs/runbook.md`
- `apps/api/tests/` (if test framework is added)
- `apps/web/tests/` (if UI tests are added)
