/**
 * Bets service - business logic for placing and managing bets.
 */
import { config } from "../config";
import { buildTrustSet, buildBetPayment, buildMintPayment } from "../xrpl/tx-builder";
import type { MitateMemoData } from "../xrpl/memo";
import {
  createBet,
  getBetById,
  getBetByPaymentTx,
  listBetsByMarket,
  listBetsByUser,
  listConfirmedBetsByOutcome,
  updateBet,
  getTotalBetAmount,
  type BetInsert,
  type Bet,
  type BetOutcome,
} from "../db/models/bets";
import {
  getMarketById,
  canPlaceBet,
  addToPool,
} from "../db/models/markets";
import { getEscrowByMarket, addToEscrow } from "../db/models/escrows";

// ── Types ──────────────────────────────────────────────────────────

export interface PlaceBetInput {
  marketId: string;
  outcome: BetOutcome;
  amountDrops: string;
  userAddress: string;
}

export interface PlaceBetResult {
  bet: Bet;
  trustSetTx?: unknown;
  paymentTx: unknown;
}

export interface ConfirmBetInput {
  betId: string;
  paymentTxHash: string;
}

// ── Service Functions ──────────────────────────────────────────────

/**
 * Create a bet intent.
 * 1. Validate market is open and deadline not passed
 * 2. Create pending bet record
 * 3. Return TrustSet and Payment tx payloads for signing
 */
export function placeBet(input: PlaceBetInput): PlaceBetResult {
  // Validate amount
  const amount = BigInt(input.amountDrops);
  if (amount <= 0n) {
    throw new Error("Bet amount must be positive");
  }

  // Validate market
  const market = getMarketById(input.marketId);
  if (!market) {
    throw new Error("Market not found");
  }
  if (!canPlaceBet(market)) {
    throw new Error("Market is not accepting bets");
  }

  // Create pending bet
  const memo: MitateMemoData = {
    v: 1,
    type: "bet",
    marketId: input.marketId,
    outcome: input.outcome,
    amount: input.amountDrops,
    timestamp: new Date().toISOString(),
  };

  const bet = createBet({
    marketId: input.marketId,
    userId: input.userAddress,
    outcome: input.outcome,
    amountDrops: input.amountDrops,
    memoJson: JSON.stringify(memo),
  });

  // Build TrustSet tx (user sets trust line for outcome tokens)
  const trustSetTx = buildTrustSet({
    account: input.userAddress,
    issuerAddress: config.issuerAddress,
    marketId: input.marketId,
    outcome: input.outcome,
    limitValue: input.amountDrops, // Trust limit = bet amount
  });

  // Build Payment tx (user pays XRP to operator)
  const paymentTx = buildBetPayment({
    account: input.userAddress,
    destination: config.operatorAddress,
    amountDrops: input.amountDrops,
    marketId: input.marketId,
    outcome: input.outcome,
  });

  return {
    bet,
    trustSetTx,
    paymentTx,
  };
}

/**
 * Confirm a bet after payment is validated on ledger.
 * 1. Verify payment tx on XRPL
 * 2. Update pool totals
 * 3. Queue token minting (via worker)
 */
export async function confirmBet(input: ConfirmBetInput): Promise<Bet> {
  const bet = getBetById(input.betId);
  if (!bet) {
    throw new Error("Bet not found");
  }
  if (bet.status !== "Pending") {
    throw new Error(`Bet is already ${bet.status}`);
  }

  // Check if tx hash is already used
  const existingBet = getBetByPaymentTx(input.paymentTxHash);
  if (existingBet) {
    throw new Error("Payment tx already used for another bet");
  }

  const market = getMarketById(bet.market_id);
  if (!market) {
    throw new Error("Market not found");
  }

  // Note: In production, we'd verify the tx on XRPL here
  // For now, trust the client-provided hash and let the worker reconcile

  // Update bet with payment tx
  updateBet(bet.id, {
    status: "Confirmed",
    paymentTx: input.paymentTxHash,
  });

  // Update market pool totals
  addToPool(market.id, bet.outcome as BetOutcome, bet.amount_drops);

  // Update escrow tracking (if exists)
  const escrow = getEscrowByMarket(market.id);
  if (escrow) {
    addToEscrow(escrow.id, bet.amount_drops);
  }

  return getBetById(bet.id)!;
}

/**
 * Build token mint transaction for a confirmed bet.
 * Called by worker after bet is confirmed.
 */
export function buildMintTx(betId: string): unknown | null {
  const bet = getBetById(betId);
  if (!bet || bet.status !== "Confirmed" || bet.mint_tx) {
    return null;
  }

  // Payment from issuer to user (minting IOUs)
  return buildMintPayment({
    issuerAddress: config.issuerAddress,
    destination: bet.user_id,
    marketId: bet.market_id,
    outcome: bet.outcome as BetOutcome,
    tokenValue: bet.amount_drops,
  });
}

/**
 * Mark bet as minted after token tx is confirmed.
 */
export function markBetMinted(betId: string, mintTxHash: string): Bet | null {
  return updateBet(betId, { mintTx: mintTxHash });
}

/**
 * Mark bet as failed.
 */
export function markBetFailed(betId: string): Bet | null {
  return updateBet(betId, { status: "Failed" });
}

/**
 * Get a single bet.
 */
export function getBet(id: string): Bet | null {
  return getBetById(id);
}

/**
 * Get bets for a market.
 */
export function getBetsForMarket(marketId: string, status?: string): Bet[] {
  if (status && ["Pending", "Confirmed", "Failed", "Refunded"].includes(status)) {
    return listBetsByMarket(marketId, status as Bet["status"]);
  }
  return listBetsByMarket(marketId);
}

/**
 * Get bets for a user.
 */
export function getBetsForUser(userId: string): Bet[] {
  return listBetsByUser(userId);
}

/**
 * Calculate potential payout for a bet.
 */
export function calculatePotentialPayout(
  marketId: string,
  outcome: BetOutcome,
  amountDrops: string
): string {
  const market = getMarketById(marketId);
  if (!market) {
    return "0";
  }

  const totalPool = BigInt(market.pool_total_drops);
  const outcomeTotal = BigInt(
    outcome === "YES" ? market.yes_total_drops : market.no_total_drops
  );
  const betAmount = BigInt(amountDrops);

  // Add the new bet to the pool for calculation
  const newTotal = totalPool + betAmount;
  const newOutcomeTotal = outcomeTotal + betAmount;

  if (newOutcomeTotal === 0n) {
    return newTotal.toString();
  }

  // Parimutuel payout = totalPool * betAmount / outcomeTotal
  const payout = (newTotal * betAmount) / newOutcomeTotal;
  return payout.toString();
}

/**
 * Calculate actual payout for a resolved market.
 */
export function calculateActualPayout(bet: Bet): string {
  const market = getMarketById(bet.market_id);
  if (!market || market.status !== "Resolved" || !market.outcome) {
    return "0";
  }

  // Losing bets get nothing
  if (bet.outcome !== market.outcome) {
    return "0";
  }

  const totalPool = BigInt(market.pool_total_drops);
  const winningTotal = BigInt(
    market.outcome === "YES" ? market.yes_total_drops : market.no_total_drops
  );
  const betAmount = BigInt(bet.amount_drops);

  if (winningTotal === 0n) {
    return "0";
  }

  const payout = (totalPool * betAmount) / winningTotal;
  return payout.toString();
}
