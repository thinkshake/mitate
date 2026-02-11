-- MITATE Initial Schema
-- Based on data-model.md

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL, -- xaman|gemwallet|manual
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Markets table
CREATE TABLE IF NOT EXISTS markets (
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

-- Bets table
CREATE TABLE IF NOT EXISTS bets (
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

-- Escrows table
CREATE TABLE IF NOT EXISTS escrows (
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

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
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

-- Payouts table
CREATE TABLE IF NOT EXISTS payouts (
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

-- Wallet links table (allows multiple providers per user)
CREATE TABLE IF NOT EXISTS wallet_links (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  provider TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (wallet_address, provider),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Ledger events table (for idempotent XRPL event ingestion)
CREATE TABLE IF NOT EXISTS ledger_events (
  id TEXT PRIMARY KEY,
  tx_hash TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  market_id TEXT,
  payload_json TEXT NOT NULL,
  ledger_index INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- System state table (for tracking sync state, etc.)
CREATE TABLE IF NOT EXISTS system_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_markets_status ON markets(status);
CREATE INDEX IF NOT EXISTS idx_markets_deadline ON markets(betting_deadline);
CREATE INDEX IF NOT EXISTS idx_bets_market ON bets(market_id);
CREATE INDEX IF NOT EXISTS idx_bets_user ON bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_status ON bets(status);
CREATE INDEX IF NOT EXISTS idx_escrows_market ON escrows(market_id);
CREATE INDEX IF NOT EXISTS idx_trades_market ON trades(market_id);
CREATE INDEX IF NOT EXISTS idx_payouts_market ON payouts(market_id);
CREATE INDEX IF NOT EXISTS idx_payouts_user ON payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_events_market ON ledger_events(market_id);
CREATE INDEX IF NOT EXISTS idx_ledger_events_ledger ON ledger_events(ledger_index);
