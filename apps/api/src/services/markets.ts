/**
 * Market service - business logic for market creation and management.
 */
import { config } from "../config";
import { buildEscrowCreate } from "../xrpl/tx-builder";
import { getTransaction } from "../xrpl/client";
import type { MitateMemoData } from "../xrpl/memo";
import {
  createMarket,
  createMarketWithOutcomes,
  getMarketById,
  getMarketWithOutcomes,
  listMarkets,
  listMarketsWithOutcomes,
  listOpenMarkets,
  updateMarket,
  getMarketsToClose,
  type MarketInsert,
  type MarketUpdate,
  type Market,
  type MarketWithOutcomes,
  type MarketStatus,
} from "../db/models/markets";
import { createEscrow } from "../db/models/escrows";

// ── Types ──────────────────────────────────────────────────────────

export interface CreateMarketInput {
  title: string;
  description: string;
  category?: string;
  categoryLabel?: string;
  bettingDeadline: string;
  resolutionTime?: string;
  outcomes?: { label: string }[];
}

export interface CreateMarketResult {
  market: MarketWithOutcomes;
  escrowTx?: unknown;
}

// ── Service Functions ──────────────────────────────────────────────

/**
 * Create a new market with outcomes.
 * 1. Create DB record in Draft status with outcomes
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

  // Validate outcomes
  const outcomes = input.outcomes ?? [{ label: "YES" }, { label: "NO" }];
  if (outcomes.length < 2 || outcomes.length > 5) {
    throw new Error("Markets must have 2-5 outcomes");
  }

  // Create market record with outcomes
  const marketData = {
    title: input.title,
    description: input.description,
    category: input.category,
    categoryLabel: input.categoryLabel,
    createdBy: creatorAddress,
    bettingDeadline: input.bettingDeadline,
    resolutionTime: input.resolutionTime,
    issuerAddress: config.issuerAddress,
    operatorAddress: config.operatorAddress,
    outcomes,
  };

  const market = createMarketWithOutcomes(marketData);

  // Build initial escrow creation tx
  const rippleEpochOffset = 946684800;
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
 * If escrowSequence is 0 or 1, fetches it from XRPL.
 */
export async function confirmMarketCreation(
  marketId: string,
  escrowTxHash: string,
  escrowSequence: number
): Promise<Market | null> {
  const market = getMarketById(marketId);
  if (!market) {
    throw new Error("Market not found");
  }
  if (market.status !== "Draft") {
    throw new Error(`Cannot confirm market in ${market.status} status`);
  }

  // Fetch sequence from XRPL if not provided properly
  let finalSequence = escrowSequence;
  if (escrowSequence <= 1) {
    try {
      const txData = await getTransaction(escrowTxHash);
      if (txData?.Sequence) {
        finalSequence = txData.Sequence;
      }
      // Verify transaction was successful
      if (txData?.meta?.TransactionResult !== "tesSUCCESS") {
        throw new Error(`Transaction failed: ${txData?.meta?.TransactionResult}`);
      }
    } catch (err) {
      console.warn("Could not fetch tx sequence from XRPL, using provided:", err);
      // Continue with provided sequence
    }
  }

  // Create escrow record
  const deadline = new Date(market.betting_deadline);
  createEscrow({
    marketId: market.id,
    amountDrops: "1",
    sequence: finalSequence,
    createTx: escrowTxHash,
    cancelAfter: Math.floor(deadline.getTime() / 1000),
  });

  // Update market to Open
  return updateMarket(marketId, {
    status: "Open",
    xrplEscrowTx: escrowTxHash,
    xrplEscrowSequence: finalSequence,
  });
}

/**
 * Get a single market by ID (without outcomes).
 */
export function getMarket(id: string): Market | null {
  return getMarketById(id);
}

/**
 * Get a single market with outcomes and probabilities.
 */
export function getMarketFull(id: string): MarketWithOutcomes | null {
  return getMarketWithOutcomes(id);
}

/**
 * List all markets with outcomes.
 */
export function getMarkets(status?: string, category?: string): MarketWithOutcomes[] {
  const filters: { status?: MarketStatus; category?: string } = {};

  if (status && ["Draft", "Open", "Closed", "Resolved", "Paid", "Canceled", "Stalled"].includes(status)) {
    filters.status = status as MarketStatus;
  }
  if (category) {
    filters.category = category;
  }

  return listMarketsWithOutcomes(Object.keys(filters).length > 0 ? filters : undefined);
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
  update: Partial<Pick<MarketUpdate, "title" | "description" | "category" | "categoryLabel">>
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
 * Calculate odds for a market (legacy YES/NO).
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
 * Calculate implied price from odds (legacy YES/NO).
 */
export function calculatePrice(market: Market): { yes: number; no: number } {
  const odds = calculateOdds(market);
  return odds;
}
