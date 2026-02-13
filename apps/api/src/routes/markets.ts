/**
 * Markets API routes.
 */
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  createNewMarket,
  confirmMarketCreation,
  getMarket,
  getMarketFull,
  getMarkets,
  getOpenMarketsForBetting,
  updateMarketMetadata,
  calculateOdds,
  calculatePrice,
} from "../services/markets";
import { config } from "../config";
import { getOutcomesWithProbability } from "../db/models/outcomes";

const markets = new Hono();

// ── Schemas ────────────────────────────────────────────────────────

const createMarketSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  category: z.string().max(50).optional(),
  categoryLabel: z.string().max(50).optional(),
  bettingDeadline: z.string().datetime(),
  resolutionTime: z.string().datetime().optional(),
  outcomes: z
    .array(z.object({ label: z.string().min(1).max(200) }))
    .min(2)
    .max(5)
    .optional(),
});

const confirmMarketSchema = z.object({
  escrowTxHash: z.string().min(1),
  escrowSequence: z.number().int().positive(),
});

const updateMarketSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  category: z.string().max(50).optional(),
  categoryLabel: z.string().max(50).optional(),
});

// ── Helpers ────────────────────────────────────────────────────────

function formatMarketResponse(m: {
  id: string;
  title: string;
  description: string;
  category: string | null;
  category_label: string | null;
  status: string;
  betting_deadline: string;
  pool_total_drops: string;
  created_at: string;
  outcomes?: { id: string; label: string; probability: number; total_amount_drops: string }[];
}) {
  return {
    id: m.id,
    title: m.title,
    description: m.description,
    category: m.category,
    categoryLabel: m.category_label,
    status: m.status,
    bettingDeadline: m.betting_deadline,
    totalPoolDrops: m.pool_total_drops,
    outcomes: (m.outcomes ?? []).map((o) => ({
      id: o.id,
      label: o.label,
      probability: o.probability,
      totalAmountDrops: o.total_amount_drops,
    })),
    createdAt: m.created_at,
  };
}

// ── Routes ─────────────────────────────────────────────────────────

/**
 * GET /markets - List markets with optional filters
 */
markets.get("/", async (c) => {
  const status = c.req.query("status");
  const category = c.req.query("category");
  const marketList = getMarkets(status, category);

  return c.json({
    markets: marketList.map(formatMarketResponse),
  });
});

/**
 * GET /markets/open - List markets available for betting
 */
markets.get("/open", async (c) => {
  const marketList = getOpenMarketsForBetting();

  return c.json({
    markets: marketList.map((m) => {
      const outcomes = getOutcomesWithProbability(m.id);
      return formatMarketResponse({ ...m, outcomes });
    }),
  });
});

/**
 * GET /markets/:id - Get market details with outcomes
 */
markets.get("/:id", async (c) => {
  const id = c.req.param("id");
  const market = getMarketFull(id);

  if (!market) {
    return c.json({ error: { code: "MARKET_NOT_FOUND", message: "Market not found" } }, 404);
  }

  return c.json({
    ...formatMarketResponse(market),
    escrowTxHash: market.xrpl_escrow_tx,
    escrowSequence: market.xrpl_escrow_sequence,
    resolutionTime: market.resolution_time,
    resolvedOutcomeId: market.resolved_outcome_id,
    issuerAddress: market.issuer_address,
    operatorAddress: market.operator_address,
  });
});

/**
 * POST /markets - Create a new market (admin only)
 */
markets.post("/", zValidator("json", createMarketSchema), async (c) => {
  // Check admin auth
  const adminKey = c.req.header("X-Admin-Key");
  if (!adminKey || adminKey !== config.adminApiKey) {
    return c.json({ error: { code: "AUTH_REQUIRED", message: "Admin authentication required" } }, 401);
  }

  const body = c.req.valid("json");

  try {
    const result = await createNewMarket(body, config.operatorAddress);

    return c.json({
      ...formatMarketResponse(result.market),
      escrowTx: result.escrowTx,
    }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create market";
    return c.json({ error: { code: "VALIDATION_ERROR", message } }, 400);
  }
});

/**
 * POST /markets/:id/confirm - Confirm market creation after XRPL tx
 */
markets.post("/:id/confirm", zValidator("json", confirmMarketSchema), async (c) => {
  const adminKey = c.req.header("X-Admin-Key");
  if (!adminKey || adminKey !== config.adminApiKey) {
    return c.json({ error: { code: "AUTH_REQUIRED", message: "Admin authentication required" } }, 401);
  }

  const id = c.req.param("id");
  const body = c.req.valid("json");

  try {
    const market = confirmMarketCreation(id, body.escrowTxHash, body.escrowSequence);
    if (!market) {
      return c.json({ error: { code: "MARKET_NOT_FOUND", message: "Market not found" } }, 404);
    }

    return c.json({
      data: {
        id: market.id,
        status: market.status,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to confirm market";
    return c.json({ error: { code: "VALIDATION_ERROR", message } }, 400);
  }
});

/**
 * POST /markets/:id/test-open - Open market for testing (skip XRPL escrow)
 * WARNING: For development/demo only. Bypasses real escrow creation.
 */
markets.post("/:id/test-open", async (c) => {
  const adminKey = c.req.header("X-Admin-Key");
  if (!adminKey || adminKey !== config.adminApiKey) {
    return c.json({ error: { code: "AUTH_REQUIRED", message: "Admin authentication required" } }, 401);
  }

  const id = c.req.param("id");
  const market = getMarket(id);

  if (!market) {
    return c.json({ error: { code: "MARKET_NOT_FOUND", message: "Market not found" } }, 404);
  }

  if (market.status !== "Draft") {
    return c.json({ error: { code: "VALIDATION_ERROR", message: `Cannot open market in ${market.status} status` } }, 400);
  }

  // Import updateMarket from db model
  const { updateMarket } = await import("../db/models/markets");
  const updated = updateMarket(id, { status: "Open" });

  return c.json({
    data: {
      id: updated?.id,
      status: updated?.status,
      message: "Market opened for testing (no XRPL escrow)",
    },
  });
});

/**
 * PATCH /markets/:id - Update market metadata (admin only)
 */
markets.patch("/:id", zValidator("json", updateMarketSchema), async (c) => {
  const adminKey = c.req.header("X-Admin-Key");
  if (!adminKey || adminKey !== config.adminApiKey) {
    return c.json({ error: { code: "AUTH_REQUIRED", message: "Admin authentication required" } }, 401);
  }

  const id = c.req.param("id");
  const body = c.req.valid("json");

  try {
    const market = updateMarketMetadata(id, body);
    if (!market) {
      return c.json({ error: { code: "MARKET_NOT_FOUND", message: "Market not found" } }, 404);
    }

    return c.json({
      data: {
        id: market.id,
        title: market.title,
        description: market.description,
        category: market.category,
        categoryLabel: market.category_label,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update market";
    return c.json({ error: { code: "VALIDATION_ERROR", message } }, 400);
  }
});

/**
 * POST /markets/:id/resolve - Resolve a market (admin only)
 */
markets.post("/:id/resolve", async (c) => {
  const adminKey = c.req.header("X-Admin-Key");
  if (!adminKey || adminKey !== config.adminApiKey) {
    return c.json({ error: { code: "AUTH_REQUIRED", message: "Admin authentication required" } }, 401);
  }

  const id = c.req.param("id");
  const body = await c.req.json<{ outcomeId: string; txHash?: string }>();

  if (!body.outcomeId) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "outcomeId is required" } }, 400);
  }

  const { updateMarket } = await import("../db/models/markets");
  const market = getMarket(id);
  if (!market) {
    return c.json({ error: { code: "MARKET_NOT_FOUND", message: "Market not found" } }, 404);
  }

  if (market.status !== "Closed" && market.status !== "Open") {
    return c.json({ error: { code: "VALIDATION_ERROR", message: `Cannot resolve market in ${market.status} status` } }, 400);
  }

  const updated = updateMarket(id, {
    status: "Resolved",
    resolvedOutcomeId: body.outcomeId,
  });

  return c.json({
    data: {
      id: updated?.id,
      status: updated?.status,
      resolvedOutcomeId: updated?.resolved_outcome_id,
    },
  });
});

/**
 * POST /markets/:id/close - Close market (admin only)
 */
markets.post("/:id/close", async (c) => {
  const adminKey = c.req.header("X-Admin-Key");
  if (!adminKey || adminKey !== config.adminApiKey) {
    return c.json({ error: { code: "AUTH_REQUIRED", message: "Admin authentication required" } }, 401);
  }

  const id = c.req.param("id");
  const market = getMarket(id);

  if (!market) {
    return c.json({ error: { code: "MARKET_NOT_FOUND", message: "Market not found" } }, 404);
  }

  if (market.status !== "Open") {
    return c.json({ error: { code: "VALIDATION_ERROR", message: `Cannot close market in ${market.status} status` } }, 400);
  }

  // Import updateMarket from db model
  const { updateMarket } = await import("../db/models/markets");
  const updated = updateMarket(id, { status: "Closed" });

  return c.json({
    data: {
      id: updated?.id,
      status: updated?.status,
    },
  });
});

export default markets;
