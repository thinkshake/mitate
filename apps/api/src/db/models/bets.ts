/**
 * DB model for the bets table.
 */
import { getDb, generateId } from "../index";

// ── Types ──────────────────────────────────────────────────────────

export type BetStatus = "Pending" | "Confirmed" | "Failed" | "Refunded";
export type BetOutcome = "YES" | "NO";

export interface Bet {
  id: string;
  market_id: string;
  user_id: string;
  outcome: BetOutcome;
  amount_drops: string;
  status: BetStatus;
  placed_at: string;
  payment_tx: string | null;
  escrow_tx: string | null;
  mint_tx: string | null;
  memo_json: string | null;
}

export interface BetInsert {
  marketId: string;
  userId: string;
  outcome: BetOutcome;
  amountDrops: string;
  memoJson?: string;
}

export interface BetUpdate {
  status?: BetStatus;
  paymentTx?: string;
  escrowTx?: string;
  mintTx?: string;
}

// ── Queries ────────────────────────────────────────────────────────

/**
 * Create a new bet (initially Pending).
 */
export function createBet(bet: BetInsert): Bet {
  const db = getDb();
  const id = generateId("bet");
  
  db.query(
    `INSERT INTO bets (id, market_id, user_id, outcome, amount_drops, status, memo_json)
     VALUES (?, ?, ?, ?, ?, 'Pending', ?)`
  ).run(
    id,
    bet.marketId,
    bet.userId,
    bet.outcome,
    bet.amountDrops,
    bet.memoJson ?? null
  );

  return getBetById(id)!;
}

/**
 * Get a bet by ID.
 */
export function getBetById(id: string): Bet | null {
  const db = getDb();
  return db.query("SELECT * FROM bets WHERE id = ?").get(id) as Bet | null;
}

/**
 * Get a bet by payment transaction hash.
 */
export function getBetByPaymentTx(paymentTx: string): Bet | null {
  const db = getDb();
  return db.query("SELECT * FROM bets WHERE payment_tx = ?").get(paymentTx) as Bet | null;
}

/**
 * List bets for a market.
 */
export function listBetsByMarket(marketId: string, status?: BetStatus): Bet[] {
  const db = getDb();
  if (status) {
    return db.query(
      "SELECT * FROM bets WHERE market_id = ? AND status = ? ORDER BY placed_at DESC"
    ).all(marketId, status) as Bet[];
  }
  return db.query(
    "SELECT * FROM bets WHERE market_id = ? ORDER BY placed_at DESC"
  ).all(marketId) as Bet[];
}

/**
 * List bets for a user.
 */
export function listBetsByUser(userId: string): Bet[] {
  const db = getDb();
  return db.query(
    "SELECT * FROM bets WHERE user_id = ? ORDER BY placed_at DESC"
  ).all(userId) as Bet[];
}

/**
 * List confirmed bets for a market and outcome.
 */
export function listConfirmedBetsByOutcome(
  marketId: string,
  outcome: BetOutcome
): Bet[] {
  const db = getDb();
  return db.query(
    `SELECT * FROM bets 
     WHERE market_id = ? AND outcome = ? AND status = 'Confirmed'
     ORDER BY placed_at ASC`
  ).all(marketId, outcome) as Bet[];
}

/**
 * Update a bet.
 */
export function updateBet(id: string, update: BetUpdate): Bet | null {
  const db = getDb();
  const sets: string[] = [];
  const values: (string | number | null)[] = [];

  if (update.status !== undefined) {
    sets.push("status = ?");
    values.push(update.status);
  }
  if (update.paymentTx !== undefined) {
    sets.push("payment_tx = ?");
    values.push(update.paymentTx);
  }
  if (update.escrowTx !== undefined) {
    sets.push("escrow_tx = ?");
    values.push(update.escrowTx);
  }
  if (update.mintTx !== undefined) {
    sets.push("mint_tx = ?");
    values.push(update.mintTx);
  }

  if (sets.length === 0) {
    return getBetById(id);
  }

  values.push(id);
  db.query(`UPDATE bets SET ${sets.join(", ")} WHERE id = ?`).run(...values);
  return getBetById(id);
}

/**
 * Calculate total bet amount for a market and outcome.
 */
export function getTotalBetAmount(marketId: string, outcome?: BetOutcome): string {
  const db = getDb();
  if (outcome) {
    const result = db.query(
      `SELECT COALESCE(SUM(CAST(amount_drops AS INTEGER)), 0) as total
       FROM bets WHERE market_id = ? AND outcome = ? AND status = 'Confirmed'`
    ).get(marketId, outcome) as { total: number };
    return result.total.toString();
  }
  const result = db.query(
    `SELECT COALESCE(SUM(CAST(amount_drops AS INTEGER)), 0) as total
     FROM bets WHERE market_id = ? AND status = 'Confirmed'`
  ).get(marketId) as { total: number };
  return result.total.toString();
}

/**
 * Get pending bets older than a threshold (for cleanup).
 */
export function getStalePendingBets(olderThanMinutes: number): Bet[] {
  const db = getDb();
  return db.query(
    `SELECT * FROM bets 
     WHERE status = 'Pending' 
     AND datetime(placed_at) < datetime('now', '-' || ? || ' minutes')`
  ).all(olderThanMinutes) as Bet[];
}
