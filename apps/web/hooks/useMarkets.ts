"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getMarkets,
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

export function useMarkets(params?: {
  status?: string;
  category?: string;
}): UseMarketsResult {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMarkets(params);
      setMarkets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load markets");
    } finally {
      setLoading(false);
    }
  }, [params?.status, params?.category]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { markets, loading, error, refetch: fetchData };
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

  const fetchData = useCallback(async () => {
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
    fetchData();
  }, [fetchData]);

  return { market, loading, error, refetch: fetchData };
}
