/**
 * Admin API routes for token minting and management.
 */
import { Hono } from "hono";
import { config } from "../config";
import { getPendingMints, updateBet } from "../db/models/bets";
import { getMarketById } from "../db/models/markets";
import { getOutcomeById } from "../db/models/outcomes";
import { buildMintTx } from "../services/bets";

const admin = new Hono();

// ── Auth middleware ────────────────────────────────────────────────

function requireAdmin(c: any, next: () => Promise<void>) {
  const adminKey = c.req.header("X-Admin-Key");
  if (!adminKey || adminKey !== config.adminApiKey) {
    return c.json({ error: { code: "AUTH_REQUIRED", message: "Admin authentication required" } }, 401);
  }
  return next();
}

// ── Routes ─────────────────────────────────────────────────────────

/**
 * GET /admin/mints/pending - List confirmed bets awaiting token mint
 */
admin.get("/mints/pending", requireAdmin, async (c) => {
  const bets = getPendingMints();
  
  // Enrich with market and outcome info
  const enriched = bets.map((bet) => {
    const market = getMarketById(bet.market_id);
    const outcome = bet.outcome_id ? getOutcomeById(bet.outcome_id) : null;
    
    return {
      id: bet.id,
      marketId: bet.market_id,
      marketTitle: market?.title ?? "Unknown",
      userId: bet.user_id,
      outcomeId: bet.outcome_id,
      outcomeLabel: outcome?.label ?? bet.outcome,
      amountDrops: bet.amount_drops,
      effectiveAmountDrops: bet.effective_amount_drops,
      weightScore: bet.weight_score,
      paymentTx: bet.payment_tx,
      placedAt: bet.placed_at,
    };
  });

  return c.json({
    pendingMints: enriched,
    count: enriched.length,
  });
});

/**
 * POST /admin/mints/:betId/prepare - Get unsigned mint tx for a bet
 */
admin.post("/mints/:betId/prepare", requireAdmin, async (c) => {
  const betId = c.req.param("betId");
  
  const mintTx = buildMintTx(betId);
  if (!mintTx) {
    return c.json({ 
      error: { code: "MINT_NOT_AVAILABLE", message: "Bet not eligible for minting or already minted" } 
    }, 400);
  }

  return c.json({
    betId,
    mintTx,
    issuerAddress: config.issuerAddress,
  });
});

/**
 * POST /admin/mints/:betId/confirm - Confirm mint after tx is submitted
 */
admin.post("/mints/:betId/confirm", requireAdmin, async (c) => {
  const betId = c.req.param("betId");
  const body = await c.req.json<{ mintTxHash: string }>();

  if (!body.mintTxHash) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "mintTxHash is required" } }, 400);
  }

  const updated = updateBet(betId, { mintTx: body.mintTxHash });
  if (!updated) {
    return c.json({ error: { code: "BET_NOT_FOUND", message: "Bet not found" } }, 404);
  }

  return c.json({
    data: {
      betId: updated.id,
      mintTx: updated.mint_tx,
      status: "minted",
    },
  });
});

/**
 * GET /admin/stats - Get admin dashboard stats
 */
admin.get("/stats", requireAdmin, async (c) => {
  const pendingMints = getPendingMints();
  
  return c.json({
    pendingMintsCount: pendingMints.length,
    issuerAddress: config.issuerAddress,
    operatorAddress: config.operatorAddress,
  });
});

export default admin;
