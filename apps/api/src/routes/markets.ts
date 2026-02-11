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
  getMarkets,
  getOpenMarketsForBetting,
  updateMarketMetadata,
  calculateOdds,
  calculatePrice,
} from "../services/markets";
import { config } from "../config";

const markets = new Hono();

// ── Schemas ────────────────────────────────────────────────────────

const createMarketSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  category: z.string().max(50).optional(),
  bettingDeadline: z.string().datetime(),
  resolutionTime: z.string().datetime().optional(),
});

const confirmMarketSchema = z.object({
  escrowTxHash: z.string().min(1),
  escrowSequence: z.number().int().positive(),
});

const updateMarketSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  category: z.string().max(50).optional(),
});

// ── Routes ─────────────────────────────────────────────────────────

/**
 * GET /markets - List markets
 */
markets.get("/", async (c) => {
  const status = c.req.query("status");
  const marketList = getMarkets(status);

  return c.json({
    data: marketList.map((m) => ({
      id: m.id,
      title: m.title,
      status: m.status,
      bettingDeadline: m.betting_deadline,
      poolTotalDrops: m.pool_total_drops,
      yesTotalDrops: m.yes_total_drops,
      noTotalDrops: m.no_total_drops,
      ...calculatePrice(m),
    })),
  });
});

/**
 * GET /markets/open - List markets available for betting
 */
markets.get("/open", async (c) => {
  const marketList = getOpenMarketsForBetting();

  return c.json({
    data: marketList.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      category: m.category,
      bettingDeadline: m.betting_deadline,
      poolTotalDrops: m.pool_total_drops,
      yesTotalDrops: m.yes_total_drops,
      noTotalDrops: m.no_total_drops,
      ...calculateOdds(m),
    })),
  });
});

/**
 * GET /markets/:id - Get market details
 */
markets.get("/:id", async (c) => {
  const id = c.req.param("id");
  const market = getMarket(id);

  if (!market) {
    return c.json({ error: { code: "MARKET_NOT_FOUND", message: "Market not found" } }, 404);
  }

  return c.json({
    data: {
      id: market.id,
      title: market.title,
      description: market.description,
      category: market.category,
      status: market.status,
      outcome: market.outcome,
      bettingDeadline: market.betting_deadline,
      resolutionTime: market.resolution_time,
      issuerAddress: market.issuer_address,
      operatorAddress: market.operator_address,
      xrplEscrowSequence: market.xrpl_escrow_sequence,
      poolTotalDrops: market.pool_total_drops,
      yesTotalDrops: market.yes_total_drops,
      noTotalDrops: market.no_total_drops,
      ...calculateOdds(market),
      ...calculatePrice(market),
    },
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
      data: {
        id: result.market.id,
        status: result.market.status,
        escrowTx: result.escrowTx,
      },
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
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update market";
    return c.json({ error: { code: "VALIDATION_ERROR", message } }, 400);
  }
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
