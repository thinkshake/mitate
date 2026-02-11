/**
 * DB model for the payouts table.
 * Tracks XRP payouts to winning bettors.
 */
import { getDb, generateId } from "../index";

// ── Types ──────────────────────────────────────────────────────────

export type PayoutStatus = "Pending" | "Sent" | "Failed";

export interface Payout {
  id: string;
  market_id: string;
  user_id: string;
  amount_drops: string;
  status: PayoutStatus;
  payout_tx: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayoutInsert {
  marketId: string;
  userId: string;
  amountDrops: string;
}

export interface PayoutUpdate {
  status?: PayoutStatus;
  payoutTx?: string;
}

// ── Queries ────────────────────────────────────────────────────────

/**
 * Create a new payout record.
 */
export function createPayout(payout: PayoutInsert): Payout {
  const db = getDb();
  const id = generateId("pay");
  
  db.query(
    `INSERT INTO payouts (id, market_id, user_id, amount_drops, status)
     VALUES (?, ?, ?, ?, 'Pending')`
  ).run(id, payout.marketId, payout.userId, payout.amountDrops);

  return getPayoutById(id)!;
}

/**
 * Create multiple payouts in a batch.
 */
export function createPayoutsBatch(payouts: PayoutInsert[]): Payout[] {
  const db = getDb();
  const results: Payout[] = [];
  
  const stmt = db.query(
    `INSERT INTO payouts (id, market_id, user_id, amount_drops, status)
     VALUES (?, ?, ?, ?, 'Pending')`
  );

  for (const payout of payouts) {
    const id = generateId("pay");
    stmt.run(id, payout.marketId, payout.userId, payout.amountDrops);
    results.push(getPayoutById(id)!);
  }

  return results;
}

/**
 * Get a payout by ID.
 */
export function getPayoutById(id: string): Payout | null {
  const db = getDb();
  return db.query("SELECT * FROM payouts WHERE id = ?").get(id) as Payout | null;
}

/**
 * List payouts for a market.
 */
export function listPayoutsByMarket(marketId: string, status?: PayoutStatus): Payout[] {
  const db = getDb();
  if (status) {
    return db.query(
      "SELECT * FROM payouts WHERE market_id = ? AND status = ? ORDER BY created_at ASC"
    ).all(marketId, status) as Payout[];
  }
  return db.query(
    "SELECT * FROM payouts WHERE market_id = ? ORDER BY created_at ASC"
  ).all(marketId) as Payout[];
}

/**
 * List payouts for a user.
 */
export function listPayoutsByUser(userId: string): Payout[] {
  const db = getDb();
  return db.query(
    "SELECT * FROM payouts WHERE user_id = ? ORDER BY created_at DESC"
  ).all(userId) as Payout[];
}

/**
 * Get pending payouts for a market (for batch execution).
 */
export function getPendingPayouts(marketId: string, limit: number = 50): Payout[] {
  const db = getDb();
  return db.query(
    "SELECT * FROM payouts WHERE market_id = ? AND status = 'Pending' ORDER BY amount_drops DESC LIMIT ?"
  ).all(marketId, limit) as Payout[];
}

/**
 * Update a payout.
 */
export function updatePayout(id: string, update: PayoutUpdate): Payout | null {
  const db = getDb();
  const sets: string[] = [];
  const values: (string | number | null)[] = [];

  if (update.status !== undefined) {
    sets.push("status = ?");
    values.push(update.status);
  }
  if (update.payoutTx !== undefined) {
    sets.push("payout_tx = ?");
    values.push(update.payoutTx);
  }

  if (sets.length === 0) {
    return getPayoutById(id);
  }

  sets.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')");
  values.push(id);

  db.query(`UPDATE payouts SET ${sets.join(", ")} WHERE id = ?`).run(...values);
  return getPayoutById(id);
}

/**
 * Get payout stats for a market.
 */
export function getPayoutStats(marketId: string): {
  total: number;
  pending: number;
  sent: number;
  failed: number;
  totalDrops: string;
  sentDrops: string;
} {
  const db = getDb();
  const result = db.query(
    `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'Sent' THEN 1 ELSE 0 END) as sent,
      SUM(CASE WHEN status = 'Failed' THEN 1 ELSE 0 END) as failed,
      COALESCE(SUM(CAST(amount_drops AS INTEGER)), 0) as total_drops,
      COALESCE(SUM(CASE WHEN status = 'Sent' THEN CAST(amount_drops AS INTEGER) ELSE 0 END), 0) as sent_drops
     FROM payouts WHERE market_id = ?`
  ).get(marketId) as {
    total: number;
    pending: number;
    sent: number;
    failed: number;
    total_drops: number;
    sent_drops: number;
  };

  return {
    total: result.total,
    pending: result.pending,
    sent: result.sent,
    failed: result.failed,
    totalDrops: result.total_drops.toString(),
    sentDrops: result.sent_drops.toString(),
  };
}

/**
 * Check if user already has a payout for this market.
 */
export function payoutExistsForUser(marketId: string, userId: string): boolean {
  const db = getDb();
  const result = db.query(
    "SELECT 1 FROM payouts WHERE market_id = ? AND user_id = ? LIMIT 1"
  ).get(marketId, userId);
  return result !== null;
}
