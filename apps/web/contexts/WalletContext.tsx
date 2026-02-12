"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
  isInstalled,
  getAddress,
  getNetwork,
  signTransaction,
  submitTransaction,
} from "@gemwallet/api";

// ── Types ──────────────────────────────────────────────────────────

export interface WalletState {
  connected: boolean;
  address: string | null;
  network: string | null;
  loading: boolean;
  error: string | null;
  gemWalletInstalled: boolean;
}

export interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  signAndSubmitTransaction: (tx: unknown) => Promise<{ hash: string } | null>;
}

// ── Context ────────────────────────────────────────────────────────

const WalletContext = createContext<WalletContextType | null>(null);

// ── Provider ───────────────────────────────────────────────────────

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WalletState>({
    connected: false,
    address: null,
    network: null,
    loading: false,
    error: null,
    gemWalletInstalled: false,
  });

  // Check if GemWallet is installed on mount
  useEffect(() => {
    const checkGemWallet = async () => {
      try {
        const response = await isInstalled();
        setState((s) => ({
          ...s,
          gemWalletInstalled: response.result.isInstalled,
        }));

        // Try to restore session
        const saved = localStorage.getItem("mitate_wallet");
        if (saved && response.result.isInstalled) {
          const parsed = JSON.parse(saved);
          if (parsed.address) {
            // Verify the address is still valid with GemWallet
            const addrResponse = await getAddress();
            if (addrResponse.result?.address === parsed.address) {
              const netResponse = await getNetwork();
              setState((s) => ({
                ...s,
                connected: true,
                address: parsed.address,
                network: netResponse.result?.network || "Testnet",
              }));
            } else {
              localStorage.removeItem("mitate_wallet");
            }
          }
        }
      } catch (err) {
        console.log("GemWallet not detected");
      }
    };

    checkGemWallet();
  }, []);

  const connect = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      // Check if installed
      const installedResponse = await isInstalled();
      if (!installedResponse.result.isInstalled) {
        throw new Error("GemWallet is not installed. Please install it from gemwallet.app");
      }

      // Get address
      const addressResponse = await getAddress();
      if (!addressResponse.result?.address) {
        throw new Error("Failed to get address from GemWallet");
      }

      const address = addressResponse.result.address;

      // Get network
      const networkResponse = await getNetwork();
      const network = networkResponse.result?.network || "Testnet";

      // Verify we're on testnet (GemWallet uses enum, but we check string representation)
      const networkStr = String(network).toLowerCase();
      if (!networkStr.includes("testnet") && !networkStr.includes("test")) {
        throw new Error(`Please switch GemWallet to Testnet. Current: ${network}`);
      }

      // Save to localStorage
      localStorage.setItem("mitate_wallet", JSON.stringify({ address }));

      setState({
        connected: true,
        address,
        network,
        loading: false,
        error: null,
        gemWalletInstalled: true,
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : "Connection failed",
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    localStorage.removeItem("mitate_wallet");
    setState((s) => ({
      ...s,
      connected: false,
      address: null,
      network: null,
      error: null,
    }));
  }, []);

  const signAndSubmitTransaction = useCallback(
    async (tx: unknown): Promise<{ hash: string } | null> => {
      if (!state.connected) {
        throw new Error("Wallet not connected");
      }

      try {
        // Sign and submit via GemWallet
        const response = await submitTransaction({
          transaction: tx as any,
        });

        if (response.result?.hash) {
          return { hash: response.result.hash };
        }

        throw new Error("Transaction failed or was rejected");
      } catch (err) {
        console.error("Transaction error:", err);
        throw err;
      }
    },
    [state.connected]
  );

  const value: WalletContextType = {
    ...state,
    connect,
    disconnect,
    signAndSubmitTransaction,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────

export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
