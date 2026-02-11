# MITATE REST API

Base URL: `/api`

All requests and responses are JSON unless otherwise noted.

## Authentication
Two modes are supported.
- User auth via wallet signature.
- Admin auth via server-side API key.

### User auth flow
1. `POST /auth/nonce` returns a nonce string.
1. Client signs the nonce with wallet.
1. Client posts signature to `POST /auth/verify`.
1. Server returns a short-lived JWT for API access.

Nonce request
```http
POST /api/auth/nonce
```
Response
```json
{
  "nonce": "mitate:nonce:3e8a9f1a-..."
}
```

Verify request
```http
POST /api/auth/verify
```
Body
```json
{
  "walletAddress": "r...",
  "provider": "xaman",
  "signature": "..."
}
```
Response
```json
{
  "token": "<jwt>",
  "user": {
    "id": "usr_...",
    "walletAddress": "r...",
    "provider": "xaman"
  }
}
```

### Admin auth
- `X-Admin-Key` header required for admin endpoints.
- Admin endpoints are limited to market creation, resolution, and payouts.

## Error Model
```json
{
  "error": {
    "code": "MARKET_NOT_FOUND",
    "message": "Market not found",
    "details": {}
  }
}
```

Error codes
- `AUTH_REQUIRED`
- `INVALID_SIGNATURE`
- `INSUFFICIENT_SCOPE`
- `MARKET_NOT_FOUND`
- `MARKET_CLOSED`
- `BET_TOO_LATE`
- `INVALID_OUTCOME`
- `TRUSTLINE_REQUIRED`
- `XRPL_SUBMISSION_FAILED`
- `RATE_LIMITED`
- `VALIDATION_ERROR`

## Rate Limiting
- Default: 60 requests per minute per IP.
- Authenticated: 120 requests per minute per user.
- Admin: 30 requests per minute per key.
- Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

## Endpoints

### Markets

#### GET /markets
List markets with summary and status.

Response
```json
{
  "data": [
    {
      "id": "mkt_...",
      "title": "Will BTC be above $70k on Feb 24?",
      "status": "Open",
      "bettingDeadline": "2026-02-20T00:00:00Z",
      "poolTotalDrops": "150000000",
      "yesTotalDrops": "90000000",
      "noTotalDrops": "60000000"
    }
  ]
}
```

#### GET /markets/:id
Market details with on-chain references.

Response
```json
{
  "data": {
    "id": "mkt_...",
    "title": "...",
    "description": "...",
    "status": "Open",
    "bettingDeadline": "2026-02-20T00:00:00Z",
    "resolutionTime": null,
    "issuerAddress": "r...",
    "operatorAddress": "r...",
    "xrplEscrowSequence": 12345,
    "poolTotalDrops": "150000000",
    "yesTotalDrops": "90000000",
    "noTotalDrops": "60000000"
  }
}
```

#### POST /markets
Create market. Admin only.

Request
```json
{
  "title": "...",
  "description": "...",
  "category": "crypto",
  "bettingDeadline": "2026-02-20T00:00:00Z",
  "resolutionTime": "2026-02-21T00:00:00Z"
}
```
Response
```json
{
  "data": {
    "id": "mkt_...",
    "status": "Draft"
  }
}
```

#### PATCH /markets/:id
Update metadata. Admin only.

#### POST /markets/:id/close
Admin only. Moves market to `Closed` when deadline passes.

### Betting

#### POST /markets/:id/bets
Create bet intent. Returns tx payloads.

Request
```json
{
  "outcome": "YES",
  "amountDrops": "1000000"
}
```
Response
```json
{
  "data": {
    "trustSet": {
      "TransactionType": "TrustSet",
      "Account": "rUser...",
      "LimitAmount": {
        "currency": "<hex>",
        "issuer": "rIssuer...",
        "value": "1000000"
      },
      "Memos": ["..."]
    },
    "payment": {
      "TransactionType": "Payment",
      "Account": "rUser...",
      "Destination": "rOperator...",
      "Amount": "1000000",
      "Memos": ["..."]
    }
  }
}
```

#### POST /markets/:id/bets/confirm
Confirm bet by tx hash. Mints tokens after verification.

Request
```json
{
  "paymentTx": "<hash>"
}
```
Response
```json
{
  "data": {
    "betId": "bet_...",
    "status": "Confirmed"
  }
}
```

### Trading

#### POST /markets/:id/offers
Create offer intent. Returns OfferCreate payload.

Request
```json
{
  "side": "sell",
  "outcome": "YES",
  "takerGets": "1000",
  "takerPaysDrops": "2000000"
}
```
Response
```json
{
  "data": {
    "offer": {
      "TransactionType": "OfferCreate",
      "Account": "rUser...",
      "TakerGets": {
        "currency": "<hex>",
        "issuer": "rIssuer...",
        "value": "1000"
      },
      "TakerPays": "2000000",
      "Memos": ["..."]
    }
  }
}
```

### Resolution and Payout

#### POST /markets/:id/resolve
Admin only. Initiates EscrowFinish or EscrowCancel.

Request
```json
{
  "outcome": "YES",
  "action": "finish" 
}
```
Response
```json
{
  "data": {
    "status": "Resolved",
    "escrowFinishTx": "<hash>"
  }
}
```

#### POST /markets/:id/payouts
Admin only. Executes payouts for winners.

Request
```json
{
  "batchSize": 50
}
```
Response
```json
{
  "data": {
    "payoutsCreated": 50,
    "status": "InProgress"
  }
}
```

#### GET /markets/:id/payouts
List payouts for a market.

### Wallets

#### POST /wallet/connect
Associates wallet with user.

Request
```json
{
  "walletAddress": "r...",
  "provider": "xaman"
}
```

#### GET /wallet/:address
Returns user profile and balances.

Response
```json
{
  "data": {
    "walletAddress": "r...",
    "markets": 3,
    "balances": [
      { "currency": "YES", "issuer": "r...", "value": "100" }
    ]
  }
}
```

## Webhooks and Realtime
- SSE endpoint: `GET /events` for live market updates.
- Events: `MarketUpdated`, `BetConfirmed`, `TradeExecuted`, `PayoutSent`.

## Validation and Security
- All inputs validated using Zod schemas in the API layer.
- Memo payloads are validated for `v`, `type`, and `marketId`.
- XRPL network must be Testnet; reject mainnet accounts.

