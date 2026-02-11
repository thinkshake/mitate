import { Hono } from "hono";
import { getDb } from "../db";
import { getXrplHealth } from "../xrpl/client";

const app = new Hono();

/**
 * Health check endpoint.
 * Returns 200 if the server is running.
 */
app.get("/health", async (c) => {
  const xrplHealth = await getXrplHealth();

  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    xrpl: xrplHealth,
  });
});

/**
 * Readiness check endpoint.
 * Returns 200 only if all dependencies are ready.
 */
app.get("/ready", async (c) => {
  const checks: Record<string, { status: "ok" | "error"; message?: string }> = {};

  // Check database
  try {
    const db = getDb();
    const result = db.query("SELECT 1 as test").get() as { test: number } | null;
    if (result?.test === 1) {
      checks.database = { status: "ok" };
    } else {
      checks.database = { status: "error", message: "Query failed" };
    }
  } catch (err) {
    checks.database = {
      status: "error",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }

  // Check XRPL connection
  const xrplHealth = await getXrplHealth();
  if (xrplHealth.connected) {
    checks.xrpl = { status: "ok" };
  } else {
    checks.xrpl = {
      status: "error",
      message: xrplHealth.error || "Not connected",
    };
  }

  const allReady = Object.values(checks).every((check) => check.status === "ok");

  return c.json(
    {
      status: allReady ? "ready" : "not_ready",
      timestamp: new Date().toISOString(),
      checks,
    },
    allReady ? 200 : 503
  );
});

export default app;
