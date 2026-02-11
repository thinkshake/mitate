/**
 * Trades service - DEX trading for outcome tokens.
 */
import { config } from "../config";
import { buildOfferCreate } from "../xrpl/tx-builder";
import { getMarketById, canPlaceBet } from "../db/models/markets";
import {
  createTrade,
  getTradeById,
  getTradeByOfferTx,
  listTradesByMarket,
  listTradesBeforeDeadline,
  getTradeVolume,
  tradeExists,
  type Trade,
  type TradeInsert,
} from "../db/models/trades";

// ── Types ──────────────────────────────────────────────────────────

export interface CreateOfferInput {
  marketId: string;
  userAddress: string;
  outcome: "YES" | "NO";
  side: "buy" | "sell";
  tokenAmount: string;
  xrpAmountDrops: string;
}

export interface CreateOfferResult {
  offerTx: unknown;
}

// ── Service Functions ──────────────────────────────────────────────

/**
 * Create an offer to trade outcome tokens on the DEX.
 * Returns the OfferCreate tx payload for signing.
 */
export function createOffer(input: CreateOfferInput): CreateOfferResult {
  const market = getMarketById(input.marketId);
  if (!market) {
    throw new Error("Market not found");
  }

  // Only allow trading while market is Open
  if (market.status !== "Open") {
    throw new Error(`Cannot trade on market in ${market.status} status`);
  }

  // Calculate expiration (betting deadline in Ripple epoch)
  const deadline = new Date(market.betting_deadline);
  const rippleEpochOffset = 946684800;
  const expiration = Math.floor(deadline.getTime() / 1000) - rippleEpochOffset;

  let offerTx: unknown;

  if (input.side === "sell") {
    // Selling tokens for XRP
    offerTx = buildOfferCreate({
      account: input.userAddress,
      issuerAddress: config.issuerAddress,
      marketId: input.marketId,
      outcome: input.outcome,
      takerGetsTokenValue: input.tokenAmount,
      takerPaysDrops: input.xrpAmountDrops,
      expiration,
    });
  } else {
    // Buying tokens with XRP
    // Note: For buy orders, we need to swap TakerGets/TakerPays
    // This is a simplified version - in production would need more complex logic
    offerTx = {
      TransactionType: "OfferCreate",
      Account: input.userAddress,
      TakerGets: input.xrpAmountDrops,
      TakerPays: {
        currency: `02${Buffer.from(`${input.marketId}:${input.outcome}`).toString("hex").toUpperCase()}`.slice(0, 40).padEnd(40, "0"),
        issuer: config.issuerAddress,
        value: input.tokenAmount,
      },
      Expiration: expiration,
    };
  }

  return { offerTx };
}

/**
 * Record a trade from ledger events.
 * Called by the ledger sync worker.
 */
export function recordTrade(trade: TradeInsert): Trade | null {
  // Check if already recorded (idempotent)
  if (tradeExists(trade.offerTx)) {
    return getTradeByOfferTx(trade.offerTx);
  }

  return createTrade(trade);
}

/**
 * Get trades for a market.
 */
export function getTradesForMarket(marketId: string): Trade[] {
  return listTradesByMarket(marketId);
}

/**
 * Get valid trades (before deadline) for payout calculation.
 */
export function getValidTradesForPayout(marketId: string): Trade[] {
  const market = getMarketById(marketId);
  if (!market) {
    return [];
  }
  return listTradesBeforeDeadline(marketId, market.betting_deadline);
}

/**
 * Get trade statistics for a market.
 */
export function getTradeStats(marketId: string): {
  count: number;
  volumeDrops: string;
} {
  const volume = getTradeVolume(marketId);
  return {
    count: volume.count,
    volumeDrops: volume.totalDrops,
  };
}

/**
 * Get a single trade.
 */
export function getTrade(id: string): Trade | null {
  return getTradeById(id);
}
