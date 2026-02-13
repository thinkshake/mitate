/**
 * Bets service - business logic for placing and managing bets.
 */
import { config } from "../config";
import {
  buildTrustSet,
  buildBetPayment,
  buildMintPayment,
  buildOutcomeBetPayment,
  buildOutcomeTrustSet,
  buildOutcomeMintPayment,
} from "../xrpl/tx-builder";
import type { MitateMemoData } from "../xrpl/memo";
import {
  createBet,
  getBetById,
  getBetByPaymentTx,
  listBetsByMarket,
  listBetsByUser,
  listConfirmedBetsByOutcome,
  listConfirmedBetsByOutcomeId,
  updateBet,
  getTotalBetAmount,
  getTotalEffectiveAmount,
  type BetInsert,
  type Bet,
  type BetOutcome,
} from "../db/models/bets";
import {
  getMarketById,
  canPlaceBet,
  addToPool,
  addToPoolMultiOutcome,
} from "../db/models/markets";
import { getEscrowByMarket, addToEscrow } from "../db/models/escrows";
import {
  getOutcomeById,
  addToOutcomeTotal,
  getOutcomesWithProbability,
  type Outcome,
} from "../db/models/outcomes";
import {
  getAttributesForUser,
  calculateWeightScore,
} from "../db/models/user-attributes";
import { getOrCreateUser } from "../db/models/users";

// ── Types ──────────────────────────────────────────────────────────

export interface PlaceBetInput {
  marketId: string;
  outcomeId: string;
  amountDrops: string;
  userAddress: string;
}

export interface PlaceBetResult {
  bet: Bet;
  weightScore: number;
  effectiveAmountDrops: string;
  trustSetTx?: unknown;
  paymentTx: unknown;
}

export interface ConfirmBetInput {
  betId: string;
  paymentTxHash: string;
}

// ── Service Functions ──────────────────────────────────────────────

/**
 * Create a bet intent for a multi-outcome market.
 * 1. Validate market is open and deadline not passed
 * 2. Look up user weight from attributes
 * 3. Create pending bet record with weight and effective amount
 * 4. Return TrustSet and Payment tx payloads for signing
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

  // Validate outcome belongs to this market
  const outcome = getOutcomeById(input.outcomeId);
  if (!outcome) {
    throw new Error("Outcome not found");
  }
  if (outcome.market_id !== input.marketId) {
    throw new Error("Outcome does not belong to this market");
  }

  // Get or create user record for foreign key constraint
  const user = getOrCreateUser(input.userAddress);

  // Calculate weight score from user attributes
  const attributes = getAttributesForUser(input.userAddress);
  const weightScore = calculateWeightScore(attributes);
  const effectiveAmountDrops = Math.round(Number(input.amountDrops) * weightScore).toString();

  // Create pending bet
  const memo: MitateMemoData = {
    v: 1,
    type: "bet",
    marketId: input.marketId,
    outcomeId: input.outcomeId,
    amount: input.amountDrops,
    timestamp: new Date().toISOString(),
  };

  const bet = createBet({
    marketId: input.marketId,
    userId: user.id,
    outcome: "YES", // Legacy field - kept for backward compat
    outcomeId: input.outcomeId,
    amountDrops: input.amountDrops,
    weightScore,
    effectiveAmountDrops,
    memoJson: JSON.stringify(memo),
  });

  // Build TrustSet tx for outcome token
  const trustSetTx = outcome.currency_code
    ? buildOutcomeTrustSet({
        account: input.userAddress,
        issuerAddress: config.issuerAddress,
        marketId: input.marketId,
        outcomeId: input.outcomeId,
        currencyCode: outcome.currency_code,
        limitValue: effectiveAmountDrops,
      })
    : undefined;

  // Build Payment tx (user pays XRP to operator)
  // Use market's stored operator address (set at market creation)
  const operatorAddress = market.operator_address || config.operatorAddress;
  if (!operatorAddress) {
    throw new Error("Operator address not configured");
  }

  const paymentTx = buildOutcomeBetPayment({
    account: input.userAddress,
    destination: operatorAddress,
    amountDrops: input.amountDrops,
    marketId: input.marketId,
    outcomeId: input.outcomeId,
  });

  return {
    bet,
    weightScore,
    effectiveAmountDrops,
    trustSetTx,
    paymentTx,
  };
}

/**
 * Confirm a bet after payment is validated on ledger.
 * 1. Verify payment tx on XRPL
 * 2. Update pool totals (market + outcome)
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

  // Update bet with payment tx
  updateBet(bet.id, {
    status: "Confirmed",
    paymentTx: input.paymentTxHash,
  });

  // Update market pool total
  const effectiveAmount = bet.effective_amount_drops ?? bet.amount_drops;
  addToPoolMultiOutcome(market.id, effectiveAmount);

  // Update outcome total
  if (bet.outcome_id) {
    addToOutcomeTotal(bet.outcome_id, effectiveAmount);
  }

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

  // Multi-outcome: use outcome currency code
  if (bet.outcome_id) {
    const outcome = getOutcomeById(bet.outcome_id);
    if (outcome?.currency_code) {
      return buildOutcomeMintPayment({
        issuerAddress: config.issuerAddress,
        destination: bet.user_id,
        marketId: bet.market_id,
        outcomeId: bet.outcome_id,
        currencyCode: outcome.currency_code,
        tokenValue: bet.effective_amount_drops ?? bet.amount_drops,
      });
    }
  }

  // Legacy YES/NO fallback
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
 * Calculate potential payout for a multi-outcome bet.
 * Uses effective amounts (with weight applied).
 */
export function calculatePotentialPayout(
  marketId: string,
  outcomeId: string,
  amountDrops: string,
  userAddress?: string
): { potentialPayout: string; weightScore: number; effectiveAmount: string } {
  const market = getMarketById(marketId);
  if (!market) {
    return { potentialPayout: "0", weightScore: 1.0, effectiveAmount: amountDrops };
  }

  // Calculate weight
  let weightScore = 1.0;
  if (userAddress) {
    const attributes = getAttributesForUser(userAddress);
    weightScore = calculateWeightScore(attributes);
  }
  const effectiveAmount = Math.round(Number(amountDrops) * weightScore).toString();

  // Get outcomes for probability calculation
  const outcomes = getOutcomesWithProbability(marketId);
  const targetOutcome = outcomes.find((o) => o.id === outcomeId);
  if (!targetOutcome) {
    return { potentialPayout: "0", weightScore, effectiveAmount };
  }

  // Calculate pool-based payout
  const totalPool = outcomes.reduce(
    (sum, o) => sum + BigInt(o.total_amount_drops),
    0n
  );
  const outcomeTotal = BigInt(targetOutcome.total_amount_drops);
  const betEffective = BigInt(effectiveAmount);

  const newTotal = totalPool + betEffective;
  const newOutcomeTotal = outcomeTotal + betEffective;

  if (newOutcomeTotal === 0n) {
    return { potentialPayout: newTotal.toString(), weightScore, effectiveAmount };
  }

  const payout = (newTotal * betEffective) / newOutcomeTotal;
  return { potentialPayout: payout.toString(), weightScore, effectiveAmount };
}

/**
 * Calculate actual payout for a resolved market (multi-outcome).
 */
export function calculateActualPayout(bet: Bet): string {
  const market = getMarketById(bet.market_id);
  if (!market || market.status !== "Resolved") {
    return "0";
  }

  // Check if this bet's outcome won
  const resolvedOutcomeId = market.resolved_outcome_id;
  if (!resolvedOutcomeId) {
    // Legacy YES/NO resolution
    if (!market.outcome || bet.outcome !== market.outcome) {
      return "0";
    }
    const totalPool = BigInt(market.pool_total_drops);
    const winningTotal = BigInt(
      market.outcome === "YES" ? market.yes_total_drops : market.no_total_drops
    );
    const betAmount = BigInt(bet.amount_drops);
    if (winningTotal === 0n) return "0";
    return ((totalPool * betAmount) / winningTotal).toString();
  }

  // Multi-outcome resolution
  if (bet.outcome_id !== resolvedOutcomeId) {
    return "0";
  }

  const totalPool = BigInt(market.pool_total_drops);
  const winningTotal = BigInt(getTotalEffectiveAmount(market.id, resolvedOutcomeId));
  const betEffective = BigInt(bet.effective_amount_drops ?? bet.amount_drops);

  if (winningTotal === 0n) return "0";
  return ((totalPool * betEffective) / winningTotal).toString();
}
