# MITATE Data Model (SQLite)

## Overview
SQLite is the system of record for market lifecycle, XRPL transaction mapping, and payouts. The database is append-friendly and reconciles with XRPL ledger events.

## Tables

### users
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL, -- xaman|gemwallet|manual
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
```

### markets
```sql
CREATE TABLE markets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  status TEXT NOT NULL, -- Draft|Open|Closed|Resolved|Paid|Canceled|Stalled
  outcome TEXT, -- YES|NO when resolved
  created_by TEXT NOT NULL,
  betting_deadline TEXT NOT NULL,
  resolution_time TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  xrpl_market_tx TEXT, -- tx hash for market creation
  xrpl_escrow_sequence INTEGER,
  xrpl_escrow_tx TEXT,
  xrpl_escrow_finish_tx TEXT,
  xrpl_escrow_cancel_tx TEXT,
  pool_total_drops TEXT NOT NULL DEFAULT '0',
  yes_total_drops TEXT NOT NULL DEFAULT '0',
  no_total_drops TEXT NOT NULL DEFAULT '0',
  issuer_address TEXT NOT NULL,
  operator_address TEXT NOT NULL
);
```

### bets
```sql
CREATE TABLE bets (
  id TEXT PRIMARY KEY,
  market_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  outcome TEXT NOT NULL, -- YES|NO
  amount_drops TEXT NOT NULL,
  status TEXT NOT NULL, -- Pending|Confirmed|Failed|Refunded
  placed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  payment_tx TEXT, -- user Payment tx hash
  escrow_tx TEXT, -- escrow creation tx hash
  mint_tx TEXT, -- issuer Payment tx hash
  memo_json TEXT,
  FOREIGN KEY (market_id) REFERENCES markets(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### escrows
```sql
CREATE TABLE escrows (
  id TEXT PRIMARY KEY,
  market_id TEXT NOT NULL,
  amount_drops TEXT NOT NULL,
  status TEXT NOT NULL, -- Open|Finished|Canceled
  sequence INTEGER NOT NULL,
  create_tx TEXT NOT NULL,
  finish_tx TEXT,
  cancel_tx TEXT,
  cancel_after INTEGER NOT NULL,
  finish_after INTEGER,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (market_id) REFERENCES markets(id)
);
```

### trades
```sql
CREATE TABLE trades (
  id TEXT PRIMARY KEY,
  market_id TEXT NOT NULL,
  offer_tx TEXT NOT NULL,
  taker_gets TEXT NOT NULL,
  taker_pays TEXT NOT NULL,
  executed_at TEXT NOT NULL,
  ledger_index INTEGER NOT NULL,
  memo_json TEXT,
  FOREIGN KEY (market_id) REFERENCES markets(id)
);
```

### payouts
```sql
CREATE TABLE payouts (
  id TEXT PRIMARY KEY,
  market_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  amount_drops TEXT NOT NULL,
  status TEXT NOT NULL, -- Pending|Sent|Failed
  payout_tx TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (market_id) REFERENCES markets(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### wallet_links
```sql
CREATE TABLE wallet_links (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  provider TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (wallet_address, provider),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### ledger_events
```sql
CREATE TABLE ledger_events (
  id TEXT PRIMARY KEY,
  tx_hash TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  market_id TEXT,
  payload_json TEXT NOT NULL,
  ledger_index INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
```

### system_state
```sql
CREATE TABLE system_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
```

## Indexes
```sql
CREATE INDEX idx_markets_status ON markets(status);
CREATE INDEX idx_markets_deadline ON markets(betting_deadline);
CREATE INDEX idx_bets_market ON bets(market_id);
CREATE INDEX idx_bets_user ON bets(user_id);
CREATE INDEX idx_bets_status ON bets(status);
CREATE INDEX idx_escrows_market ON escrows(market_id);
CREATE INDEX idx_trades_market ON trades(market_id);
CREATE INDEX idx_payouts_market ON payouts(market_id);
CREATE INDEX idx_payouts_user ON payouts(user_id);
CREATE INDEX idx_ledger_events_market ON ledger_events(market_id);
CREATE INDEX idx_ledger_events_ledger ON ledger_events(ledger_index);
```

## Relationships and Constraints
- `markets` to `bets`, `escrows`, `trades`, and `payouts` are one-to-many.
- `users` to `bets` and `payouts` are one-to-many.
- `wallet_links` allows multiple providers per user.
- `ledger_events.tx_hash` is unique for idempotent ingestion.
- `escrows.sequence` is unique per market via application logic.

## Migration Strategy
- Use a lightweight migration table with ordered SQL files.
- Run migrations on API startup and worker startup with a DB lock to avoid race conditions.
- Keep migrations idempotent with `IF NOT EXISTS` for tables and indexes.

Migration table
```sql
CREATE TABLE IF NOT EXISTS migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
```

Migration flow
1. Load migration files in lexical order.
1. For each file, check `migrations.name`.
1. Apply in a transaction.
1. Insert a record on success.

## WAL and Concurrency
- Enable WAL mode for better concurrent reads.
- Set a busy timeout for write contention.

```sql
PRAGMA journal_mode = WAL;
PRAGMA busy_timeout = 5000;
```
