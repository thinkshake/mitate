/**
 * DB model for the outcomes table.
 * Each market has 2-5 outcomes that users can bet on.
 */
import { getDb, generateId } from "../index";

// ── Types ──────────────────────────────────────────────────────────

export interface Outcome {
  id: string;
  market_id: string;
  label: string;
  currency_code: string | null;
  total_amount_drops: string;
  display_order: number;
  created_at: string;
}

export interface OutcomeInsert {
  marketId: string;
  label: string;
  currencyCode?: string;
  displayOrder?: number;
}

// ── Currency Code Generation ───────────────────────────────────────

/**
 * Generate a unique 3-character XRPL currency code for an outcome.
 * Format: first char from market prefix + 2 chars from outcome index.
 * XRPL allows 3-char ASCII codes (standard) or 40-hex (non-standard).
 */
export function generateCurrencyCode(
  marketId: string,
  outcomeIndex: number
): string {
  // Use uppercase letters: M + market hash char + outcome letter (A, B, C...)
  const marketChar = marketId.replace(/[^a-zA-Z0-9]/g, "").charAt(4).toUpperCase() || "X";
  const outcomeChar = String.fromCharCode(65 + outcomeIndex); // A, B, C, D, E
  return `M${marketChar}${outcomeChar}`;
}

// ── Queries ────────────────────────────────────────────────────────

/**
 * Create a single outcome.
 */
export function createOutcome(outcome: OutcomeInsert): Outcome {
  const db = getDb();
  const id = generateId("out");

  db.query(
    `INSERT INTO outcomes (id, market_id, label, currency_code, display_order)
     VALUES (?, ?, ?, ?, ?)`
  ).run(
    id,
    outcome.marketId,
    outcome.label,
    outcome.currencyCode ?? null,
    outcome.displayOrder ?? 0
  );

  return getOutcomeById(id)!;
}

/**
 * Create multiple outcomes for a market in batch.
 */
export function createOutcomesBatch(
  marketId: string,
  outcomes: { label: string; currencyCode?: string }[]
): Outcome[] {
  const db = getDb();
  const results: Outcome[] = [];

  const stmt = db.query(
    `INSERT INTO outcomes (id, market_id, label, currency_code, display_order)
     VALUES (?, ?, ?, ?, ?)`
  );

  for (let i = 0; i < outcomes.length; i++) {
    const id = generateId("out");
    const currencyCode =
      outcomes[i].currencyCode ?? generateCurrencyCode(marketId, i);

    stmt.run(id, marketId, outcomes[i].label, currencyCode, i);
    results.push(getOutcomeById(id)!);
  }

  return results;
}

/**
 * Get an outcome by ID.
 */
export function getOutcomeById(id: string): Outcome | null {
  const db = getDb();
  return db.query("SELECT * FROM outcomes WHERE id = ?").get(id) as Outcome | null;
}

/**
 * List all outcomes for a market, ordered by display_order.
 */
export function listOutcomesByMarket(marketId: string): Outcome[] {
  const db = getDb();
  return db
    .query(
      "SELECT * FROM outcomes WHERE market_id = ? ORDER BY display_order ASC"
    )
    .all(marketId) as Outcome[];
}

/**
 * Update the total amount for an outcome (add to existing).
 */
export function addToOutcomeTotal(
  id: string,
  amountDrops: string
): void {
  const db = getDb();
  db.query(
    `UPDATE outcomes SET
      total_amount_drops = CAST(CAST(total_amount_drops AS INTEGER) + ? AS TEXT)
     WHERE id = ?`
  ).run(amountDrops, id);
}

/**
 * Calculate probability for each outcome in a market.
 * Returns outcomes with a `probability` field (0-100 integer).
 */
export function getOutcomesWithProbability(
  marketId: string
): (Outcome & { probability: number })[] {
  const outcomes = listOutcomesByMarket(marketId);
  const totalPool = outcomes.reduce(
    (sum, o) => sum + BigInt(o.total_amount_drops),
    0n
  );

  if (totalPool === 0n) {
    // Equal probability when no bets
    const equalProb = Math.floor(100 / outcomes.length);
    const remainder = 100 - equalProb * outcomes.length;
    return outcomes.map((o, i) => ({
      ...o,
      probability: equalProb + (i === 0 ? remainder : 0),
    }));
  }

  // Calculate proportional probabilities
  const rawProbs = outcomes.map((o) => ({
    outcome: o,
    raw: Number((BigInt(o.total_amount_drops) * 10000n) / totalPool) / 100,
  }));

  // Round to integers, ensure they sum to 100
  const rounded = rawProbs.map((p) => Math.round(p.raw));
  const diff = 100 - rounded.reduce((s, v) => s + v, 0);
  if (diff !== 0) {
    // Adjust the largest outcome
    const maxIdx = rounded.indexOf(Math.max(...rounded));
    rounded[maxIdx] += diff;
  }

  return rawProbs.map((p, i) => ({
    ...p.outcome,
    probability: rounded[i],
  }));
}

/**
 * Delete all outcomes for a market (used in cleanup).
 */
export function deleteOutcomesByMarket(marketId: string): void {
  const db = getDb();
  db.query("DELETE FROM outcomes WHERE market_id = ?").run(marketId);
}
