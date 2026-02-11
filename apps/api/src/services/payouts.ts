/**
 * Payouts service - resolution and payout distribution.
 */
import { config } from "../config";
import { buildEscrowFinish, buildEscrowCancel, buildPayoutPayment } from "../xrpl/tx-builder";
import {
  getMarketById,
  updateMarket,
  type Market,
  type MarketOutcome,
} from "../db/models/markets";
import { listConfirmedBetsByOutcome, type Bet } from "../db/models/bets";
import { getEscrowByMarket, updateEscrow } from "../db/models/escrows";
import {
  createPayout,
  createPayoutsBatch,
  getPayoutById,
  listPayoutsByMarket,
  listPayoutsByUser,
  getPendingPayouts,
  updatePayout,
  getPayoutStats,
  payoutExistsForUser,
  type Payout,
} from "../db/models/payouts";

// ── Types ──────────────────────────────────────────────────────────

export interface ResolveMarketInput {
  marketId: string;
  outcome: MarketOutcome;
  action: "finish" | "cancel";
}

export interface ResolveMarketResult {
  market: Market;
  escrowTx: unknown;
  payoutsCreated?: number;
}

export interface ExecutePayoutsInput {
  marketId: string;
  batchSize?: number;
}

export interface ExecutePayoutsResult {
  payouts: Array<{
    id: string;
    userId: string;
    amountDrops: string;
    payoutTx: unknown;
  }>;
}

export interface PayoutCalculation {
  userId: string;
  betAmount: string;
  payoutAmount: string;
}

// ── Service Functions ──────────────────────────────────────────────

/**
 * Resolve a market - finish escrow and prepare payouts, or cancel and refund.
 */
export function resolveMarket(input: ResolveMarketInput): ResolveMarketResult {
  const market = getMarketById(input.marketId);
  if (!market) {
    throw new Error("Market not found");
  }

  // Only Closed markets can be resolved
  if (market.status !== "Closed") {
    throw new Error(`Cannot resolve market in ${market.status} status`);
  }

  const escrow = getEscrowByMarket(input.marketId);
  if (!escrow) {
    throw new Error("No escrow found for market");
  }

  let escrowTx: unknown;
  let payoutsCreated = 0;

  if (input.action === "finish") {
    // Build EscrowFinish tx for multi-sign
    escrowTx = buildEscrowFinish({
      account: config.operatorAddress,
      offerSequence: escrow.sequence,
      marketId: input.marketId,
      outcome: input.outcome,
    });

    // Calculate and create payout records
    const payoutCalcs = calculatePayouts(input.marketId, input.outcome);
    if (payoutCalcs.length > 0) {
      const payoutInserts = payoutCalcs.map((p) => ({
        marketId: input.marketId,
        userId: p.userId,
        amountDrops: p.payoutAmount,
      }));
      createPayoutsBatch(payoutInserts);
      payoutsCreated = payoutCalcs.length;
    }

    // Update market status
    updateMarket(input.marketId, {
      status: "Resolved",
      outcome: input.outcome,
    });

  } else {
    // Cancel - build EscrowCancel tx
    escrowTx = buildEscrowCancel({
      account: config.operatorAddress,
      offerSequence: escrow.sequence,
      marketId: input.marketId,
    });

    // Update market status
    updateMarket(input.marketId, {
      status: "Canceled",
    });
  }

  return {
    market: getMarketById(input.marketId)!,
    escrowTx,
    payoutsCreated,
  };
}

/**
 * Confirm resolution after EscrowFinish/Cancel tx is validated.
 */
export function confirmResolution(
  marketId: string,
  escrowTxHash: string,
  action: "finish" | "cancel"
): Market | null {
  const market = getMarketById(marketId);
  if (!market) {
    throw new Error("Market not found");
  }

  const escrow = getEscrowByMarket(marketId);
  if (escrow) {
    if (action === "finish") {
      updateEscrow(escrow.id, { status: "Finished", finishTx: escrowTxHash });
      updateMarket(marketId, { xrplEscrowFinishTx: escrowTxHash });
    } else {
      updateEscrow(escrow.id, { status: "Canceled", cancelTx: escrowTxHash });
      updateMarket(marketId, { xrplEscrowCancelTx: escrowTxHash });
    }
  }

  return getMarketById(marketId);
}

/**
 * Calculate payouts for winning bettors.
 * Formula: payout = totalPool * userBet / totalWinningBets
 */
export function calculatePayouts(
  marketId: string,
  winningOutcome: MarketOutcome
): PayoutCalculation[] {
  const market = getMarketById(marketId);
  if (!market) {
    return [];
  }

  const totalPool = BigInt(market.pool_total_drops);
  const winningTotal = BigInt(
    winningOutcome === "YES" ? market.yes_total_drops : market.no_total_drops
  );

  if (winningTotal === 0n) {
    return [];
  }

  // Get all winning bets
  const winningBets = listConfirmedBetsByOutcome(marketId, winningOutcome);
  const payouts: PayoutCalculation[] = [];

  for (const bet of winningBets) {
    const betAmount = BigInt(bet.amount_drops);
    // Integer division - floor rounding
    const payoutAmount = (totalPool * betAmount) / winningTotal;

    payouts.push({
      userId: bet.user_id,
      betAmount: bet.amount_drops,
      payoutAmount: payoutAmount.toString(),
    });
  }

  return payouts;
}

/**
 * Execute pending payouts in batches.
 * Returns Payment tx payloads for each payout.
 */
export function executePayouts(input: ExecutePayoutsInput): ExecutePayoutsResult {
  const market = getMarketById(input.marketId);
  if (!market) {
    throw new Error("Market not found");
  }

  if (market.status !== "Resolved") {
    throw new Error(`Cannot execute payouts for market in ${market.status} status`);
  }

  if (!market.outcome) {
    throw new Error("Market has no resolved outcome");
  }

  const batchSize = input.batchSize ?? 50;
  const pendingPayouts = getPendingPayouts(input.marketId, batchSize);

  const results: ExecutePayoutsResult["payouts"] = [];

  for (const payout of pendingPayouts) {
    const payoutTx = buildPayoutPayment({
      operatorAddress: config.operatorAddress,
      destination: payout.user_id,
      amountDrops: payout.amount_drops,
      marketId: input.marketId,
      outcome: market.outcome,
    });

    results.push({
      id: payout.id,
      userId: payout.user_id,
      amountDrops: payout.amount_drops,
      payoutTx,
    });
  }

  return { payouts: results };
}

/**
 * Confirm a payout after Payment tx is validated.
 */
export function confirmPayout(payoutId: string, txHash: string): Payout | null {
  return updatePayout(payoutId, {
    status: "Sent",
    payoutTx: txHash,
  });
}

/**
 * Mark a payout as failed.
 */
export function markPayoutFailed(payoutId: string): Payout | null {
  return updatePayout(payoutId, { status: "Failed" });
}

/**
 * Get payouts for a market.
 */
export function getPayoutsForMarket(marketId: string, status?: string): Payout[] {
  if (status && ["Pending", "Sent", "Failed"].includes(status)) {
    return listPayoutsByMarket(marketId, status as Payout["status"]);
  }
  return listPayoutsByMarket(marketId);
}

/**
 * Get payouts for a user.
 */
export function getPayoutsForUser(userId: string): Payout[] {
  return listPayoutsByUser(userId);
}

/**
 * Get payout statistics for a market.
 */
export function getMarketPayoutStats(marketId: string) {
  return getPayoutStats(marketId);
}

/**
 * Check if all payouts are complete.
 */
export function arePayoutsComplete(marketId: string): boolean {
  const stats = getPayoutStats(marketId);
  return stats.pending === 0 && stats.failed === 0;
}

/**
 * Mark market as fully paid if all payouts complete.
 */
export function finalizeMarketIfComplete(marketId: string): Market | null {
  if (arePayoutsComplete(marketId)) {
    return updateMarket(marketId, { status: "Paid" });
  }
  return getMarketById(marketId);
}
