"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getMarkets,
  getOpenMarkets,
  getMarket,
  type Market,
} from "@/lib/api";

// ── useMarkets ─────────────────────────────────────────────────────

export interface UseMarketsResult {
  markets: Market[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useMarkets(status?: string): UseMarketsResult {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = status === "open" ? await getOpenMarkets() : await getMarkets(status);
      setMarkets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load markets");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { markets, loading, error, refetch: fetch };
}

// ── useMarket ──────────────────────────────────────────────────────

export interface UseMarketResult {
  market: Market | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useMarket(id: string | null): UseMarketResult {
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!id) {
      setMarket(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getMarket(id);
      setMarket(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load market");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { market, loading, error, refetch: fetch };
}
