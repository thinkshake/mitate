"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

// ── Types ──────────────────────────────────────────────────────────

export type WalletProvider = "xaman" | "gemwallet" | null;

export interface WalletState {
  connected: boolean;
  address: string | null;
  provider: WalletProvider;
  network: string | null;
  loading: boolean;
  error: string | null;
}

export interface WalletContextType extends WalletState {
  connect: (provider: WalletProvider) => Promise<void>;
  disconnect: () => void;
  signTransaction: (tx: unknown) => Promise<string | null>;
}

// ── Context ────────────────────────────────────────────────────────

const WalletContext = createContext<WalletContextType | null>(null);

// ── Provider ───────────────────────────────────────────────────────

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WalletState>({
    connected: false,
    address: null,
    provider: null,
    network: null,
    loading: false,
    error: null,
  });

  // Restore from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("mitate_wallet");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.address && parsed.provider) {
          setState((s) => ({
            ...s,
            connected: true,
            address: parsed.address,
            provider: parsed.provider,
            network: parsed.network || "testnet",
          }));
        }
      } catch {
        localStorage.removeItem("mitate_wallet");
      }
    }
  }, []);

  const connect = useCallback(async (provider: WalletProvider) => {
    if (!provider) return;

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      let address: string | null = null;
      let network: string = "testnet";

      if (provider === "xaman") {
        // Xaman (XUMM) SDK integration
        // In production, use @xumm/sdk
        // For demo, use prompt as placeholder
        address = prompt("Enter your XRPL Testnet address (Xaman):");
        if (!address || !address.startsWith("r")) {
          throw new Error("Invalid XRPL address");
        }
      } else if (provider === "gemwallet") {
        // GemWallet integration
        // In production, use @nicholasjin/gemwallet-api
        // For demo, use prompt as placeholder
        if (typeof window !== "undefined" && (window as any).gemWallet) {
          const gem = (window as any).gemWallet;
          const response = await gem.getAddress();
          address = response?.address;
          network = response?.network || "testnet";
        } else {
          address = prompt("Enter your XRPL Testnet address (GemWallet):");
        }
        if (!address || !address.startsWith("r")) {
          throw new Error("Invalid XRPL address");
        }
      }

      if (address) {
        const walletData = { address, provider, network };
        localStorage.setItem("mitate_wallet", JSON.stringify(walletData));
        setState({
          connected: true,
          address,
          provider,
          network,
          loading: false,
          error: null,
        });
      } else {
        throw new Error("Failed to get address");
      }
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
    setState({
      connected: false,
      address: null,
      provider: null,
      network: null,
      loading: false,
      error: null,
    });
  }, []);

  const signTransaction = useCallback(
    async (tx: unknown): Promise<string | null> => {
      if (!state.connected || !state.provider) {
        throw new Error("Wallet not connected");
      }

      try {
        if (state.provider === "xaman") {
          // In production, use XUMM SDK to create payload and sign
          // For demo, return placeholder
          console.log("Xaman sign request:", tx);
          const txHash = prompt("Enter the tx hash after signing with Xaman:");
          return txHash;
        } else if (state.provider === "gemwallet") {
          // In production, use GemWallet API
          if (typeof window !== "undefined" && (window as any).gemWallet) {
            const gem = (window as any).gemWallet;
            const result = await gem.signAndSubmitTransaction(tx);
            return result?.txHash;
          }
          console.log("GemWallet sign request:", tx);
          const txHash = prompt("Enter the tx hash after signing with GemWallet:");
          return txHash;
        }
        return null;
      } catch (err) {
        console.error("Sign transaction error:", err);
        throw err;
      }
    },
    [state.connected, state.provider]
  );

  const value: WalletContextType = {
    ...state,
    connect,
    disconnect,
    signTransaction,
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
