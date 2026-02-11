/**
 * DB model for the escrows table.
 */
import { getDb, generateId } from "../index";

// ── Types ──────────────────────────────────────────────────────────

export type EscrowStatus = "Open" | "Finished" | "Canceled";

export interface Escrow {
  id: string;
  market_id: string;
  amount_drops: string;
  status: EscrowStatus;
  sequence: number;
  create_tx: string;
  finish_tx: string | null;
  cancel_tx: string | null;
  cancel_after: number;
  finish_after: number | null;
  created_at: string;
  updated_at: string;
}

export interface EscrowInsert {
  marketId: string;
  amountDrops: string;
  sequence: number;
  createTx: string;
  cancelAfter: number;
  finishAfter?: number;
}

export interface EscrowUpdate {
  status?: EscrowStatus;
  amountDrops?: string;
  finishTx?: string;
  cancelTx?: string;
}

// ── Queries ────────────────────────────────────────────────────────

/**
 * Create a new escrow record.
 */
export function createEscrow(escrow: EscrowInsert): Escrow {
  const db = getDb();
  const id = generateId("esc");
  
  db.query(
    `INSERT INTO escrows (
      id, market_id, amount_drops, status, sequence, 
      create_tx, cancel_after, finish_after
    ) VALUES (?, ?, ?, 'Open', ?, ?, ?, ?)`
  ).run(
    id,
    escrow.marketId,
    escrow.amountDrops,
    escrow.sequence,
    escrow.createTx,
    escrow.cancelAfter,
    escrow.finishAfter ?? null
  );

  return getEscrowById(id)!;
}

/**
 * Get an escrow by ID.
 */
export function getEscrowById(id: string): Escrow | null {
  const db = getDb();
  return db.query("SELECT * FROM escrows WHERE id = ?").get(id) as Escrow | null;
}

/**
 * Get the primary escrow for a market.
 */
export function getEscrowByMarket(marketId: string): Escrow | null {
  const db = getDb();
  return db.query(
    "SELECT * FROM escrows WHERE market_id = ? AND status = 'Open' ORDER BY created_at DESC LIMIT 1"
  ).get(marketId) as Escrow | null;
}

/**
 * Get an escrow by its XRPL sequence number.
 */
export function getEscrowBySequence(sequence: number): Escrow | null {
  const db = getDb();
  return db.query(
    "SELECT * FROM escrows WHERE sequence = ?"
  ).get(sequence) as Escrow | null;
}

/**
 * List all escrows for a market.
 */
export function listEscrowsByMarket(marketId: string): Escrow[] {
  const db = getDb();
  return db.query(
    "SELECT * FROM escrows WHERE market_id = ? ORDER BY created_at DESC"
  ).all(marketId) as Escrow[];
}

/**
 * Update an escrow.
 */
export function updateEscrow(id: string, update: EscrowUpdate): Escrow | null {
  const db = getDb();
  const sets: string[] = [];
  const values: (string | number | null)[] = [];

  if (update.status !== undefined) {
    sets.push("status = ?");
    values.push(update.status);
  }
  if (update.amountDrops !== undefined) {
    sets.push("amount_drops = ?");
    values.push(update.amountDrops);
  }
  if (update.finishTx !== undefined) {
    sets.push("finish_tx = ?");
    values.push(update.finishTx);
  }
  if (update.cancelTx !== undefined) {
    sets.push("cancel_tx = ?");
    values.push(update.cancelTx);
  }

  if (sets.length === 0) {
    return getEscrowById(id);
  }

  sets.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')");
  values.push(id);

  db.query(`UPDATE escrows SET ${sets.join(", ")} WHERE id = ?`).run(...values);
  return getEscrowById(id);
}

/**
 * Add amount to an existing escrow.
 */
export function addToEscrow(id: string, additionalDrops: string): void {
  const db = getDb();
  db.query(
    `UPDATE escrows SET 
      amount_drops = CAST(CAST(amount_drops AS INTEGER) + ? AS TEXT),
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
     WHERE id = ?`
  ).run(additionalDrops, id);
}

/**
 * Get escrows that can be canceled (past cancel_after time).
 */
export function getCancelableEscrows(): Escrow[] {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  return db.query(
    `SELECT * FROM escrows 
     WHERE status = 'Open' AND cancel_after <= ?`
  ).all(now) as Escrow[];
}

/**
 * Get escrows that can be finished (past finish_after time).
 */
export function getFinishableEscrows(): Escrow[] {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  return db.query(
    `SELECT * FROM escrows 
     WHERE status = 'Open' AND finish_after IS NOT NULL AND finish_after <= ?`
  ).all(now) as Escrow[];
}
