/**
 * DB model for the markets table.
 */
import { getDb, generateId } from "../index";
import { createOutcomesBatch, getOutcomesWithProbability, type Outcome } from "./outcomes";

// ── Types ──────────────────────────────────────────────────────────

export type MarketStatus = 
  | "Draft" 
  | "Open" 
  | "Closed" 
  | "Resolved" 
  | "Paid" 
  | "Canceled" 
  | "Stalled";

export type MarketOutcome = "YES" | "NO";

export interface Market {
  id: string;
  title: string;
  description: string;
  category: string | null;
  category_label: string | null;
  status: MarketStatus;
  outcome: MarketOutcome | null;
  resolved_outcome_id: string | null;
  created_by: string;
  betting_deadline: string;
  resolution_time: string | null;
  created_at: string;
  updated_at: string;
  xrpl_market_tx: string | null;
  xrpl_escrow_sequence: number | null;
  xrpl_escrow_tx: string | null;
  xrpl_escrow_finish_tx: string | null;
  xrpl_escrow_cancel_tx: string | null;
  pool_total_drops: string;
  yes_total_drops: string;
  no_total_drops: string;
  issuer_address: string;
  operator_address: string;
}

export interface MarketWithOutcomes extends Market {
  outcomes: (Outcome & { probability: number })[];
}

export interface MarketInsert {
  title: string;
  description: string;
  category?: string;
  categoryLabel?: string;
  createdBy: string;
  bettingDeadline: string;
  resolutionTime?: string;
  issuerAddress: string;
  operatorAddress: string;
}

export interface MarketWithOutcomesInsert extends MarketInsert {
  outcomes: { label: string }[];
}

export interface MarketUpdate {
  title?: string;
  description?: string;
  category?: string;
  categoryLabel?: string;
  status?: MarketStatus;
  outcome?: MarketOutcome;
  resolvedOutcomeId?: string;
  bettingDeadline?: string;
  resolutionTime?: string;
  xrplMarketTx?: string;
  xrplEscrowSequence?: number;
  xrplEscrowTx?: string;
  xrplEscrowFinishTx?: string;
  xrplEscrowCancelTx?: string;
  poolTotalDrops?: string;
  yesTotalDrops?: string;
  noTotalDrops?: string;
  operatorAddress?: string;
  issuerAddress?: string;
}

// ── Queries ────────────────────────────────────────────────────────

/**
 * Create a new market.
 */
export function createMarket(market: MarketInsert): Market {
  const db = getDb();
  const id = generateId("mkt");

  db.query(
    `INSERT INTO markets (
      id, title, description, category, category_label, status, created_by,
      betting_deadline, resolution_time, issuer_address, operator_address
    ) VALUES (?, ?, ?, ?, ?, 'Draft', ?, ?, ?, ?, ?)`
  ).run(
    id,
    market.title,
    market.description,
    market.category ?? null,
    market.categoryLabel ?? null,
    market.createdBy,
    market.bettingDeadline,
    market.resolutionTime ?? null,
    market.issuerAddress,
    market.operatorAddress
  );

  return getMarketById(id)!;
}

/**
 * Create a market with outcomes in a single transaction.
 */
export function createMarketWithOutcomes(
  market: MarketWithOutcomesInsert
): MarketWithOutcomes {
  const db = getDb();
  db.exec("BEGIN TRANSACTION");
  try {
    const created = createMarket(market);
    createOutcomesBatch(
      created.id,
      market.outcomes.map((o) => ({ label: o.label }))
    );
    db.exec("COMMIT");
    return getMarketWithOutcomes(created.id)!;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

/**
 * Get a market with its outcomes and calculated probabilities.
 */
export function getMarketWithOutcomes(id: string): MarketWithOutcomes | null {
  const market = getMarketById(id);
  if (!market) return null;

  const outcomes = getOutcomesWithProbability(id);
  return { ...market, outcomes };
}

/**
 * List all markets with outcomes attached.
 */
export function listMarketsWithOutcomes(
  filters?: { status?: MarketStatus; category?: string }
): MarketWithOutcomes[] {
  const db = getDb();
  const conditions: string[] = [];
  const values: string[] = [];

  if (filters?.status) {
    conditions.push("status = ?");
    values.push(filters.status);
  }
  if (filters?.category) {
    conditions.push("category = ?");
    values.push(filters.category);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const markets = db
    .query(`SELECT * FROM markets ${where} ORDER BY created_at DESC`)
    .all(...values) as Market[];

  return markets.map((m) => ({
    ...m,
    outcomes: getOutcomesWithProbability(m.id),
  }));
}

/**
 * Get a market by ID.
 */
export function getMarketById(id: string): Market | null {
  const db = getDb();
  return db.query("SELECT * FROM markets WHERE id = ?").get(id) as Market | null;
}

/**
 * List all markets with optional status filter.
 */
export function listMarkets(status?: MarketStatus): Market[] {
  const db = getDb();
  if (status) {
    return db.query("SELECT * FROM markets WHERE status = ? ORDER BY created_at DESC")
      .all(status) as Market[];
  }
  return db.query("SELECT * FROM markets ORDER BY created_at DESC").all() as Market[];
}

/**
 * List open markets (for betting).
 */
export function listOpenMarkets(): Market[] {
  const db = getDb();
  return db.query(
    `SELECT * FROM markets 
     WHERE status = 'Open' 
     AND betting_deadline > strftime('%Y-%m-%dT%H:%M:%fZ','now')
     ORDER BY betting_deadline ASC`
  ).all() as Market[];
}

/**
 * Update a market.
 */
export function updateMarket(id: string, update: MarketUpdate): Market | null {
  const db = getDb();
  const sets: string[] = [];
  const values: (string | number | null)[] = [];

  if (update.title !== undefined) {
    sets.push("title = ?");
    values.push(update.title);
  }
  if (update.description !== undefined) {
    sets.push("description = ?");
    values.push(update.description);
  }
  if (update.category !== undefined) {
    sets.push("category = ?");
    values.push(update.category);
  }
  if (update.categoryLabel !== undefined) {
    sets.push("category_label = ?");
    values.push(update.categoryLabel);
  }
  if (update.status !== undefined) {
    sets.push("status = ?");
    values.push(update.status);
  }
  if (update.outcome !== undefined) {
    sets.push("outcome = ?");
    values.push(update.outcome);
  }
  if (update.resolvedOutcomeId !== undefined) {
    sets.push("resolved_outcome_id = ?");
    values.push(update.resolvedOutcomeId);
  }
  if (update.bettingDeadline !== undefined) {
    sets.push("betting_deadline = ?");
    values.push(update.bettingDeadline);
  }
  if (update.resolutionTime !== undefined) {
    sets.push("resolution_time = ?");
    values.push(update.resolutionTime);
  }
  if (update.xrplMarketTx !== undefined) {
    sets.push("xrpl_market_tx = ?");
    values.push(update.xrplMarketTx);
  }
  if (update.xrplEscrowSequence !== undefined) {
    sets.push("xrpl_escrow_sequence = ?");
    values.push(update.xrplEscrowSequence);
  }
  if (update.xrplEscrowTx !== undefined) {
    sets.push("xrpl_escrow_tx = ?");
    values.push(update.xrplEscrowTx);
  }
  if (update.xrplEscrowFinishTx !== undefined) {
    sets.push("xrpl_escrow_finish_tx = ?");
    values.push(update.xrplEscrowFinishTx);
  }
  if (update.xrplEscrowCancelTx !== undefined) {
    sets.push("xrpl_escrow_cancel_tx = ?");
    values.push(update.xrplEscrowCancelTx);
  }
  if (update.poolTotalDrops !== undefined) {
    sets.push("pool_total_drops = ?");
    values.push(update.poolTotalDrops);
  }
  if (update.yesTotalDrops !== undefined) {
    sets.push("yes_total_drops = ?");
    values.push(update.yesTotalDrops);
  }
  if (update.noTotalDrops !== undefined) {
    sets.push("no_total_drops = ?");
    values.push(update.noTotalDrops);
  }
  if (update.operatorAddress !== undefined) {
    sets.push("operator_address = ?");
    values.push(update.operatorAddress);
  }
  if (update.issuerAddress !== undefined) {
    sets.push("issuer_address = ?");
    values.push(update.issuerAddress);
  }

  if (sets.length === 0) {
    return getMarketById(id);
  }

  sets.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')");
  values.push(id);

  db.query(`UPDATE markets SET ${sets.join(", ")} WHERE id = ?`).run(...values);
  return getMarketById(id);
}

/**
 * Update pool total for a multi-outcome bet.
 * Increments the market's pool_total_drops.
 */
export function addToPoolMultiOutcome(
  id: string,
  amountDrops: string
): void {
  const db = getDb();
  db.query(
    `UPDATE markets SET
      pool_total_drops = CAST(CAST(pool_total_drops AS INTEGER) + ? AS TEXT),
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
     WHERE id = ?`
  ).run(amountDrops, id);
}

/**
 * Update pool totals atomically (legacy YES/NO).
 */
export function addToPool(
  id: string,
  outcome: MarketOutcome,
  amountDrops: string
): void {
  const db = getDb();
  const amount = BigInt(amountDrops);

  if (outcome === "YES") {
    db.query(
      `UPDATE markets SET 
        pool_total_drops = CAST(CAST(pool_total_drops AS INTEGER) + ? AS TEXT),
        yes_total_drops = CAST(CAST(yes_total_drops AS INTEGER) + ? AS TEXT),
        updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
       WHERE id = ?`
    ).run(amount.toString(), amount.toString(), id);
  } else {
    db.query(
      `UPDATE markets SET 
        pool_total_drops = CAST(CAST(pool_total_drops AS INTEGER) + ? AS TEXT),
        no_total_drops = CAST(CAST(no_total_drops AS INTEGER) + ? AS TEXT),
        updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
       WHERE id = ?`
    ).run(amount.toString(), amount.toString(), id);
  }
}

/**
 * Check if betting is still allowed for a market.
 */
export function canPlaceBet(market: Market): boolean {
  if (market.status !== "Open") {
    return false;
  }
  const deadline = new Date(market.betting_deadline);
  return deadline > new Date();
}

/**
 * Get markets that have passed their deadline but are still Open.
 */
export function getMarketsToClose(): Market[] {
  const db = getDb();
  return db.query(
    `SELECT * FROM markets 
     WHERE status = 'Open' 
     AND betting_deadline <= strftime('%Y-%m-%dT%H:%M:%fZ','now')`
  ).all() as Market[];
}
