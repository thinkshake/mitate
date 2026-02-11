/**
 * Market service - business logic for market creation and management.
 */
import { config } from "../config";
import { createXrplClient } from "../xrpl/client";
import { buildEscrowCreate } from "../xrpl/tx-builder";
import type { MitateMemoData } from "../xrpl/memo";
import {
  createMarket,
  getMarketById,
  listMarkets,
  listOpenMarkets,
  updateMarket,
  getMarketsToClose,
  type MarketInsert,
  type MarketUpdate,
  type Market,
} from "../db/models/markets";
import { createEscrow } from "../db/models/escrows";

// ── Types ──────────────────────────────────────────────────────────

export interface CreateMarketInput {
  title: string;
  description: string;
  category?: string;
  bettingDeadline: string;
  resolutionTime?: string;
}

export interface CreateMarketResult {
  market: Market;
  escrowTx?: unknown;
}

// ── Service Functions ──────────────────────────────────────────────

/**
 * Create a new market.
 * 1. Create DB record in Draft status
 * 2. Build XRPL EscrowCreate tx for initial pool
 * 3. Return market and tx payload for signing
 */
export async function createNewMarket(
  input: CreateMarketInput,
  creatorAddress: string
): Promise<CreateMarketResult> {
  // Validate deadline is in the future
  const deadline = new Date(input.bettingDeadline);
  if (deadline <= new Date()) {
    throw new Error("Betting deadline must be in the future");
  }

  // Create market record
  const marketData: MarketInsert = {
    title: input.title,
    description: input.description,
    category: input.category,
    createdBy: creatorAddress,
    bettingDeadline: input.bettingDeadline,
    resolutionTime: input.resolutionTime,
    issuerAddress: config.issuerAddress,
    operatorAddress: config.operatorAddress,
  };

  const market = createMarket(marketData);

  // Build initial escrow creation tx
  // Escrow with 1 drop as placeholder (pool will grow with bets)
  // Note: XRPL uses "Ripple Epoch" which is seconds since 2000-01-01
  const rippleEpochOffset = 946684800; // Unix timestamp of 2000-01-01
  const cancelAfter = Math.floor(deadline.getTime() / 1000) - rippleEpochOffset;

  const escrowTx = buildEscrowCreate({
    account: config.operatorAddress,
    amountDrops: "1",
    cancelAfter,
    marketId: market.id,
    destinationTag: parseInt(market.id.replace("mkt_", ""), 36) % 4294967295,
  });

  return {
    market,
    escrowTx,
  };
}

/**
 * Confirm market creation after XRPL tx is validated.
 * Transitions market from Draft to Open.
 */
export function confirmMarketCreation(
  marketId: string,
  escrowTxHash: string,
  escrowSequence: number
): Market | null {
  const market = getMarketById(marketId);
  if (!market) {
    throw new Error("Market not found");
  }
  if (market.status !== "Draft") {
    throw new Error(`Cannot confirm market in ${market.status} status`);
  }

  // Create escrow record
  const deadline = new Date(market.betting_deadline);
  createEscrow({
    marketId: market.id,
    amountDrops: "1",
    sequence: escrowSequence,
    createTx: escrowTxHash,
    cancelAfter: Math.floor(deadline.getTime() / 1000),
  });

  // Update market to Open
  return updateMarket(marketId, {
    status: "Open",
    xrplEscrowTx: escrowTxHash,
    xrplEscrowSequence: escrowSequence,
  });
}

/**
 * Get a single market by ID.
 */
export function getMarket(id: string): Market | null {
  return getMarketById(id);
}

/**
 * List all markets.
 */
export function getMarkets(status?: string): Market[] {
  if (status && ["Draft", "Open", "Closed", "Resolved", "Paid", "Canceled", "Stalled"].includes(status)) {
    return listMarkets(status as Market["status"]);
  }
  return listMarkets();
}

/**
 * List markets available for betting.
 */
export function getOpenMarketsForBetting(): Market[] {
  return listOpenMarkets();
}

/**
 * Update market metadata (admin only).
 */
export function updateMarketMetadata(
  id: string,
  update: Partial<Pick<MarketUpdate, "title" | "description" | "category">>
): Market | null {
  const market = getMarketById(id);
  if (!market) {
    throw new Error("Market not found");
  }
  if (market.status !== "Draft" && market.status !== "Open") {
    throw new Error(`Cannot update market in ${market.status} status`);
  }
  return updateMarket(id, update);
}

/**
 * Close markets that have passed their betting deadline.
 * Called periodically by worker.
 */
export function closeExpiredMarkets(): Market[] {
  const markets = getMarketsToClose();
  const closed: Market[] = [];

  for (const market of markets) {
    const updated = updateMarket(market.id, { status: "Closed" });
    if (updated) {
      closed.push(updated);
    }
  }

  return closed;
}

/**
 * Calculate odds for a market.
 */
export function calculateOdds(market: Market): { yes: number; no: number } {
  const yesTotal = BigInt(market.yes_total_drops);
  const noTotal = BigInt(market.no_total_drops);
  const total = yesTotal + noTotal;

  if (total === 0n) {
    return { yes: 0.5, no: 0.5 };
  }

  return {
    yes: Number(yesTotal) / Number(total),
    no: Number(noTotal) / Number(total),
  };
}

/**
 * Calculate implied price from odds.
 */
export function calculatePrice(market: Market): { yes: number; no: number } {
  const odds = calculateOdds(market);
  // In parimutuel, implied price = 1 / (1 / odds) = odds
  // But for betting, we show what you'd get per XRP bet
  return odds;
}
