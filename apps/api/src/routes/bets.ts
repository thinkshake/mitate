/**
 * Bets API routes.
 */
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  placeBet,
  confirmBet,
  getBet,
  getBetsForMarket,
  getBetsForUser,
  calculatePotentialPayout,
  calculateActualPayout,
} from "../services/bets";
import { getMarket } from "../services/markets";

const bets = new Hono();

// ── Schemas ────────────────────────────────────────────────────────

const placeBetSchema = z.object({
  outcome: z.enum(["YES", "NO"]),
  amountDrops: z.string().regex(/^\d+$/, "Amount must be positive integer string"),
  userAddress: z.string().min(1),
});

const confirmBetSchema = z.object({
  paymentTx: z.string().min(1),
});

// ── Routes ─────────────────────────────────────────────────────────

/**
 * POST /markets/:marketId/bets - Create bet intent
 * Returns XRPL tx payloads for TrustSet and Payment
 */
bets.post("/markets/:marketId/bets", zValidator("json", placeBetSchema), async (c) => {
  const marketId = c.req.param("marketId");
  const body = c.req.valid("json");

  // Validate market exists
  const market = getMarket(marketId);
  if (!market) {
    return c.json({ error: { code: "MARKET_NOT_FOUND", message: "Market not found" } }, 404);
  }

  try {
    const result = placeBet({
      marketId,
      outcome: body.outcome,
      amountDrops: body.amountDrops,
      userAddress: body.userAddress,
    });

    // Calculate potential payout
    const potentialPayout = calculatePotentialPayout(marketId, body.outcome, body.amountDrops);

    return c.json({
      data: {
        betId: result.bet.id,
        status: result.bet.status,
        potentialPayout,
        trustSet: result.trustSetTx,
        payment: result.paymentTx,
      },
    }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create bet";
    if (message.includes("not accepting bets")) {
      return c.json({ error: { code: "MARKET_CLOSED", message } }, 400);
    }
    return c.json({ error: { code: "VALIDATION_ERROR", message } }, 400);
  }
});

/**
 * POST /markets/:marketId/bets/confirm - Confirm bet after payment tx
 */
bets.post("/markets/:marketId/bets/confirm", zValidator("json", confirmBetSchema), async (c) => {
  const marketId = c.req.param("marketId");
  const body = c.req.valid("json");

  // Get bet ID from query param
  const betId = c.req.query("betId");
  if (!betId) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "betId query param required" } }, 400);
  }

  const bet = getBet(betId);
  if (!bet) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Bet not found" } }, 404);
  }
  if (bet.market_id !== marketId) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Bet does not belong to this market" } }, 400);
  }

  try {
    const confirmedBet = await confirmBet({
      betId,
      paymentTxHash: body.paymentTx,
    });

    return c.json({
      data: {
        betId: confirmedBet.id,
        status: confirmedBet.status,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to confirm bet";
    return c.json({ error: { code: "VALIDATION_ERROR", message } }, 400);
  }
});

/**
 * GET /markets/:marketId/bets - List bets for a market
 */
bets.get("/markets/:marketId/bets", async (c) => {
  const marketId = c.req.param("marketId");
  const status = c.req.query("status");

  const market = getMarket(marketId);
  if (!market) {
    return c.json({ error: { code: "MARKET_NOT_FOUND", message: "Market not found" } }, 404);
  }

  const betList = getBetsForMarket(marketId, status);

  return c.json({
    data: betList.map((bet) => ({
      id: bet.id,
      outcome: bet.outcome,
      amountDrops: bet.amount_drops,
      status: bet.status,
      placedAt: bet.placed_at,
      userId: bet.user_id,
    })),
  });
});

/**
 * GET /bets/:id - Get a single bet
 */
bets.get("/bets/:id", async (c) => {
  const id = c.req.param("id");
  const bet = getBet(id);

  if (!bet) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "Bet not found" } }, 404);
  }

  const market = getMarket(bet.market_id);
  let payout: string | null = null;

  if (market?.status === "Resolved") {
    payout = calculateActualPayout(bet);
  }

  return c.json({
    data: {
      id: bet.id,
      marketId: bet.market_id,
      outcome: bet.outcome,
      amountDrops: bet.amount_drops,
      status: bet.status,
      placedAt: bet.placed_at,
      paymentTx: bet.payment_tx,
      mintTx: bet.mint_tx,
      payout,
    },
  });
});

/**
 * GET /users/:address/bets - List bets for a user
 */
bets.get("/users/:address/bets", async (c) => {
  const address = c.req.param("address");
  const betList = getBetsForUser(address);

  return c.json({
    data: betList.map((bet) => {
      const market = getMarket(bet.market_id);
      let payout: string | null = null;

      if (market?.status === "Resolved") {
        payout = calculateActualPayout(bet);
      }

      return {
        id: bet.id,
        marketId: bet.market_id,
        marketTitle: market?.title,
        outcome: bet.outcome,
        amountDrops: bet.amount_drops,
        status: bet.status,
        placedAt: bet.placed_at,
        payout,
      };
    }),
  });
});

/**
 * GET /markets/:marketId/bets/preview - Preview bet (calculate potential payout)
 */
bets.get("/markets/:marketId/bets/preview", async (c) => {
  const marketId = c.req.param("marketId");
  const outcome = c.req.query("outcome") as "YES" | "NO";
  const amountDrops = c.req.query("amountDrops");

  if (!outcome || !["YES", "NO"].includes(outcome)) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "outcome must be YES or NO" } }, 400);
  }
  if (!amountDrops || !/^\d+$/.test(amountDrops)) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "amountDrops must be positive integer" } }, 400);
  }

  const market = getMarket(marketId);
  if (!market) {
    return c.json({ error: { code: "MARKET_NOT_FOUND", message: "Market not found" } }, 404);
  }

  const potentialPayout = calculatePotentialPayout(marketId, outcome, amountDrops);

  // Calculate implied odds after this bet
  const currentPool = BigInt(market.pool_total_drops);
  const currentOutcome = BigInt(outcome === "YES" ? market.yes_total_drops : market.no_total_drops);
  const newPool = currentPool + BigInt(amountDrops);
  const newOutcome = currentOutcome + BigInt(amountDrops);

  const impliedOdds = Number(newOutcome) / Number(newPool);
  const potentialReturn = Number(potentialPayout) / Number(amountDrops);

  return c.json({
    data: {
      marketId,
      outcome,
      amountDrops,
      potentialPayout,
      impliedOdds: impliedOdds.toFixed(4),
      potentialReturn: potentialReturn.toFixed(4),
    },
  });
});

export default bets;
