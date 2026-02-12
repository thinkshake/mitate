"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { fetchUserAttributes, fetchUserBets, type Attribute, type UserBet } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────

export interface UserState {
  attributes: Attribute[];
  weightScore: number;
  bets: UserBet[];
  loading: boolean;
  error: string | null;
}

export interface UserContextType extends UserState {
  fetchUser: (address: string) => Promise<void>;
}

// ── Context ────────────────────────────────────────────────────────

const UserContext = createContext<UserContextType | null>(null);

// ── Weight Calculation ─────────────────────────────────────────────

function calculateWeightScore(attributes: Attribute[]): number {
  const BASE_WEIGHT = 1.0;
  const additionalWeight = attributes.reduce(
    (sum, attr) => sum + (attr.weight - 1.0),
    0,
  );
  return Math.min(3.0, Math.max(0.5, BASE_WEIGHT + additionalWeight));
}

// ── Provider ───────────────────────────────────────────────────────

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { address, connected } = useWallet();
  const [state, setState] = useState<UserState>({
    attributes: [],
    weightScore: 1.0,
    bets: [],
    loading: false,
    error: null,
  });

  const fetchUser = useCallback(async (addr: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [attrData, betsData] = await Promise.all([
        fetchUserAttributes(addr).catch(() => ({ attributes: [], weightScore: 1.0 })),
        fetchUserBets(addr).catch(() => ({ bets: [] })),
      ]);

      const attributes = attrData.attributes || [];
      const weightScore = attrData.weightScore || calculateWeightScore(attributes);

      setState({
        attributes,
        weightScore,
        bets: betsData.bets || [],
        loading: false,
        error: null,
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load user data",
      }));
    }
  }, []);

  // Auto-fetch when wallet connects
  useEffect(() => {
    if (connected && address) {
      fetchUser(address);
    } else {
      setState({
        attributes: [],
        weightScore: 1.0,
        bets: [],
        loading: false,
        error: null,
      });
    }
  }, [connected, address, fetchUser]);

  const value: UserContextType = {
    ...state,
    fetchUser,
  };

  return (
    <UserContext.Provider value={value}>{children}</UserContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────

export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
