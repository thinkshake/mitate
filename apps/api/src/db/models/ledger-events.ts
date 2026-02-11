/**
 * DB model for the ledger_events table.
 *
 * Provides idempotent ingestion of XRPL transaction events via
 * INSERT OR IGNORE on the unique tx_hash column.
 */
import { getDb, generateId } from "../index";

// ── Types ──────────────────────────────────────────────────────────

export interface LedgerEvent {
  id: string;
  tx_hash: string;
  event_type: string;
  market_id: string | null;
  payload_json: string;
  ledger_index: number;
  created_at: string;
}

export interface LedgerEventInsert {
  txHash: string;
  eventType: string;
  marketId?: string;
  payloadJson: string;
  ledgerIndex: number;
}

// ── Queries ────────────────────────────────────────────────────────

/**
 * Insert a ledger event idempotently (duplicates silently ignored).
 */
export function insertLedgerEvent(event: LedgerEventInsert): void {
  const db = getDb();
  const id = generateId("evt");
  db.query(
    `INSERT OR IGNORE INTO ledger_events
       (id, tx_hash, event_type, market_id, payload_json, ledger_index)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    event.txHash,
    event.eventType,
    event.marketId ?? null,
    event.payloadJson,
    event.ledgerIndex
  );
}

/**
 * Lookup a single event by its XRPL transaction hash.
 */
export function getLedgerEventByTxHash(
  txHash: string
): LedgerEvent | null {
  const db = getDb();
  return (
    db
      .query("SELECT * FROM ledger_events WHERE tx_hash = ?")
      .get(txHash) as LedgerEvent | null
  );
}

/**
 * List all events for a market, ascending by ledger index.
 */
export function getLedgerEventsByMarket(
  marketId: string
): LedgerEvent[] {
  const db = getDb();
  return db
    .query(
      "SELECT * FROM ledger_events WHERE market_id = ? ORDER BY ledger_index ASC"
    )
    .all(marketId) as LedgerEvent[];
}

/**
 * List events filtered by type (and optionally market).
 */
export function getLedgerEventsByType(
  eventType: string,
  marketId?: string
): LedgerEvent[] {
  const db = getDb();
  if (marketId) {
    return db
      .query(
        "SELECT * FROM ledger_events WHERE event_type = ? AND market_id = ? ORDER BY ledger_index ASC"
      )
      .all(eventType, marketId) as LedgerEvent[];
  }
  return db
    .query(
      "SELECT * FROM ledger_events WHERE event_type = ? ORDER BY ledger_index ASC"
    )
    .all(eventType) as LedgerEvent[];
}
