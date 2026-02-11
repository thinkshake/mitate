# MITATE Operations Runbook

## XRPL Account Setup

### 1. Create Testnet Accounts

```bash
# Get test XRP from faucet
curl -X POST https://faucet.altnet.rippletest.net/accounts
```

You need two accounts:
- **Operator**: Holds escrow, receives bets, sends payouts
- **Issuer**: Mints YES/NO tokens

### 2. Configure Operator Account

```javascript
// Enable rippling for token transfers
{
  "TransactionType": "AccountSet",
  "Account": "OPERATOR_ADDRESS",
  "SetFlag": 8  // asfDefaultRipple
}

// Set up multi-sign (2-of-3)
{
  "TransactionType": "SignerListSet",
  "Account": "OPERATOR_ADDRESS",
  "SignerQuorum": 2,
  "SignerEntries": [
    { "SignerEntry": { "Account": "SIGNER_1", "SignerWeight": 1 } },
    { "SignerEntry": { "Account": "SIGNER_2", "SignerWeight": 1 } },
    { "SignerEntry": { "Account": "SIGNER_3", "SignerWeight": 1 } }
  ]
}
```

### 3. Configure Issuer Account

```javascript
// Enable rippling for IOU transfers
{
  "TransactionType": "AccountSet",
  "Account": "ISSUER_ADDRESS",
  "SetFlag": 8  // asfDefaultRipple
}
```

---

## Market Operations

### Create Market (Admin)

```bash
curl -X POST http://localhost:3001/api/markets \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: YOUR_ADMIN_KEY" \
  -d '{
    "title": "Will Bitcoin reach $100K by end of 2025?",
    "description": "Resolves YES if BTC/USD >= 100000 before Dec 31 2025 23:59 UTC",
    "category": "crypto",
    "bettingDeadline": "2025-12-31T23:59:59Z"
  }'
```

Response includes `escrowTx` — sign and submit to XRPL.

### Confirm Market Creation

```bash
curl -X POST http://localhost:3001/api/markets/mkt_xxx/confirm \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: YOUR_ADMIN_KEY" \
  -d '{
    "escrowTxHash": "HASH_FROM_XRPL",
    "escrowSequence": 12345
  }'
```

### Close Market (Manual)

Markets auto-close at deadline, but can be manually closed:

```bash
curl -X POST http://localhost:3001/api/markets/mkt_xxx/close \
  -H "X-Admin-Key: YOUR_ADMIN_KEY"
```

---

## Resolution Operations

### Resolve Market

```bash
curl -X POST http://localhost:3001/api/markets/mkt_xxx/resolve \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: YOUR_ADMIN_KEY" \
  -d '{
    "outcome": "YES",
    "action": "finish"
  }'
```

Response includes `escrowTx` for multi-sign.

### Multi-Sign Process

1. Export transaction blob
2. Send to signer 1 → get partial signature
3. Send to signer 2 → get partial signature
4. Combine signatures → submit to XRPL

### Execute Payouts

```bash
curl -X POST http://localhost:3001/api/markets/mkt_xxx/payouts \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: YOUR_ADMIN_KEY" \
  -d '{ "batchSize": 50 }'
```

Returns Payment tx payloads. Sign and submit each.

### Confirm Payouts

```bash
curl -X POST http://localhost:3001/api/markets/mkt_xxx/payouts/confirm \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: YOUR_ADMIN_KEY" \
  -d '{
    "payoutId": "pay_xxx",
    "txHash": "HASH_FROM_XRPL"
  }'
```

---

## Troubleshooting

### WebSocket Disconnects

The ledger sync service reconnects automatically. Check logs:

```bash
fly logs -a mitate-api | grep "XRPL"
```

### Bet Confirmation Fails

1. Check user signed both TrustSet and Payment
2. Verify trust line limit is sufficient
3. Check Payment destination is operator address

### Escrow Finish Fails

1. Ensure CancelAfter has not passed
2. Verify multi-sign quorum is met
3. Check escrow sequence number matches

### Token Mint Fails

1. Verify issuer has DefaultRipple enabled
2. Check user's trust line exists and has sufficient limit
3. Ensure issuer has enough XRP reserve

---

## Database Maintenance

### Backup SQLite

```bash
fly ssh console -a mitate-api
sqlite3 /data/mitate.db ".backup /data/backup.db"
```

### Check Sync State

```bash
curl http://localhost:3001/health
# Returns lastLedgerIndex from system_state
```

### Reset Sync (Danger!)

```sql
DELETE FROM system_state WHERE key LIKE 'sync:%';
```

---

## Deployment Checklist

### Before Demo

- [ ] Test XRPL accounts have sufficient XRP (>100 XRP each)
- [ ] Multi-sign signers have their keys ready
- [ ] Create 2-3 demo markets with different deadlines
- [ ] Place some test bets on each market
- [ ] Verify frontend connects to production API
- [ ] Test wallet connection flow end-to-end

### Environment Variables

**Fly.io**
```bash
fly secrets set XRPL_OPERATOR_ADDRESS=rXXX
fly secrets set XRPL_ISSUER_ADDRESS=rYYY
fly secrets set ADMIN_API_KEY=xxx
```

**Vercel**
```bash
vercel env add NEXT_PUBLIC_API_URL
```

---

## Monitoring

### Health Check

```bash
curl https://mitate-api.fly.dev/health
```

### XRPL Connection

```bash
curl https://mitate-api.fly.dev/health/xrpl
```

### Logs

```bash
fly logs -a mitate-api --region nrt
```
