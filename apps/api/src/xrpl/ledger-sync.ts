/**
 * XRPL ledger synchronization service.
 *
 * Subscribes to the XRPL ledger stream and processes transactions
 * containing MITATE memos, storing events in the ledger_events table.
 *
 * Uses system_state for cursor persistence (survives restarts).
 */
import type { Client, TransactionStream } from "xrpl";
import { createXrplClient, getXrplClient } from "./client";
import { decodeMemo, isMitateMemo, type XrplMemo, type MitateMemoData } from "./memo";
import { insertLedgerEvent, getLedgerEventByTxHash } from "../db/models/ledger-events";
import { getSystemState, setSystemState } from "../db/models/system-state";
import { config } from "../config";

// ── Types ──────────────────────────────────────────────────────────

export interface SyncStatus {
  running: boolean;
  lastLedgerIndex: number | null;
  lastSyncTime: string | null;
  error: string | null;
}

interface ParsedMitateTransaction {
  txHash: string;
  ledgerIndex: number;
  memoData: MitateMemoData;
  rawTx: Record<string, unknown>;
}

// ── Constants ──────────────────────────────────────────────────────

const STATE_KEY_LAST_LEDGER = "sync:last_ledger_index";
const STATE_KEY_LAST_SYNC = "sync:last_sync_time";

// ── State ──────────────────────────────────────────────────────────

let syncRunning = false;
let lastError: string | null = null;

// ── Public API ─────────────────────────────────────────────────────

/**
 * Get current sync status.
 */
export function getSyncStatus(): SyncStatus {
  const lastLedger = getSystemState(STATE_KEY_LAST_LEDGER);
  const lastSync = getSystemState(STATE_KEY_LAST_SYNC);

  return {
    running: syncRunning,
    lastLedgerIndex: lastLedger ? parseInt(lastLedger, 10) : null,
    lastSyncTime: lastSync,
    error: lastError,
  };
}

/**
 * Start the ledger sync service.
 * Subscribes to the ledger stream and processes MITATE transactions.
 */
export async function startLedgerSync(): Promise<void> {
  if (syncRunning) {
    console.warn("Ledger sync already running");
    return;
  }

  try {
    const client = await createXrplClient();
    syncRunning = true;
    lastError = null;

    console.log("Starting ledger sync...");

    // Subscribe to transactions on the operator account
    await client.request({
      command: "subscribe",
      accounts: [config.operatorAddress],
    });

    // Also subscribe to ledger stream for general monitoring
    await client.request({
      command: "subscribe",
      streams: ["ledger"],
    });

    // Handle incoming transaction events
    client.on("transaction", (event: TransactionStream) => {
      handleTransaction(event).catch((err) => {
        console.error("Error handling transaction:", err);
        lastError = err instanceof Error ? err.message : "Unknown error";
      });
    });

    // Handle ledger close events (for cursor updates)
    client.on("ledgerClosed", (ledger) => {
      const index = ledger.ledger_index;
      setSystemState(STATE_KEY_LAST_LEDGER, String(index));
      setSystemState(STATE_KEY_LAST_SYNC, new Date().toISOString());
    });

    console.log("Ledger sync started");
  } catch (err) {
    syncRunning = false;
    lastError = err instanceof Error ? err.message : "Unknown error";
    console.error("Failed to start ledger sync:", err);
    throw err;
  }
}

/**
 * Stop the ledger sync service.
 */
export async function stopLedgerSync(): Promise<void> {
  const client = getXrplClient();
  if (!client) {
    syncRunning = false;
    return;
  }

  try {
    await client.request({
      command: "unsubscribe",
      accounts: [config.operatorAddress],
    });
    await client.request({
      command: "unsubscribe",
      streams: ["ledger"],
    });
  } catch (err) {
    console.warn("Error unsubscribing:", err);
  }

  syncRunning = false;
  console.log("Ledger sync stopped");
}

/**
 * Backfill events from a specific ledger range.
 * Useful for catching up after downtime.
 */
export async function backfillLedgerRange(
  startLedger: number,
  endLedger: number
): Promise<number> {
  const client = await createXrplClient();
  let processedCount = 0;

  console.log(`Backfilling ledgers ${startLedger} to ${endLedger}...`);

  for (let ledgerIndex = startLedger; ledgerIndex <= endLedger; ledgerIndex++) {
    try {
      const response = await client.request({
        command: "ledger",
        ledger_index: ledgerIndex,
        transactions: true,
        expand: true,
      });

      const txs = response.result.ledger.transactions ?? [];
      for (const tx of txs) {
        if (typeof tx === "object" && tx !== null) {
          const parsed = parseMitateTransaction(tx as Record<string, unknown>, ledgerIndex);
          if (parsed) {
            await processTransaction(parsed);
            processedCount++;
          }
        }
      }

      // Update cursor periodically
      if (ledgerIndex % 100 === 0) {
        setSystemState(STATE_KEY_LAST_LEDGER, String(ledgerIndex));
        console.log(`Backfill progress: ledger ${ledgerIndex}`);
      }
    } catch (err) {
      console.error(`Error backfilling ledger ${ledgerIndex}:`, err);
    }
  }

  setSystemState(STATE_KEY_LAST_LEDGER, String(endLedger));
  setSystemState(STATE_KEY_LAST_SYNC, new Date().toISOString());

  console.log(`Backfill complete: ${processedCount} MITATE events processed`);
  return processedCount;
}

/**
 * Get the last synced ledger index from state.
 */
export function getLastSyncedLedger(): number | null {
  const value = getSystemState(STATE_KEY_LAST_LEDGER);
  return value ? parseInt(value, 10) : null;
}

// ── Internal ───────────────────────────────────────────────────────

/**
 * Handle an incoming transaction stream event.
 */
async function handleTransaction(event: TransactionStream): Promise<void> {
  const tx = event.transaction;
  const meta = event.meta;

  // Skip failed transactions
  if (typeof meta === "object" && meta !== null) {
    const result = (meta as unknown as Record<string, unknown>).TransactionResult;
    if (result !== "tesSUCCESS") {
      return;
    }
  }

  const ledgerIndex = event.ledger_index ?? 0;
  const parsed = parseMitateTransaction(tx as unknown as Record<string, unknown>, ledgerIndex);

  if (parsed) {
    await processTransaction(parsed);
  }
}

/**
 * Parse a transaction and extract MITATE memo data if present.
 */
function parseMitateTransaction(
  tx: Record<string, unknown>,
  ledgerIndex: number
): ParsedMitateTransaction | null {
  const memos = tx.Memos as XrplMemo[] | undefined;
  if (!memos || !Array.isArray(memos)) {
    return null;
  }

  // Find the first MITATE memo
  for (const memo of memos) {
    if (!isMitateMemo(memo)) continue;

    const memoData = decodeMemo(memo);
    if (!memoData) continue;

    const txHash = (tx.hash ?? tx.Hash ?? "") as string;
    if (!txHash) continue;

    return {
      txHash,
      ledgerIndex,
      memoData,
      rawTx: tx,
    };
  }

  return null;
}

/**
 * Process and store a parsed MITATE transaction.
 * Idempotent: duplicate tx_hash entries are silently ignored.
 */
async function processTransaction(parsed: ParsedMitateTransaction): Promise<void> {
  // Check if already processed (defensive, DB handles dedup too)
  const existing = getLedgerEventByTxHash(parsed.txHash);
  if (existing) {
    return;
  }

  insertLedgerEvent({
    txHash: parsed.txHash,
    eventType: parsed.memoData.type,
    marketId: parsed.memoData.marketId,
    payloadJson: JSON.stringify({
      memoData: parsed.memoData,
      txType: parsed.rawTx.TransactionType,
      account: parsed.rawTx.Account,
      destination: parsed.rawTx.Destination,
    }),
    ledgerIndex: parsed.ledgerIndex,
  });

  console.log(
    `Ingested MITATE event: ${parsed.memoData.type} for market ${parsed.memoData.marketId} (tx: ${parsed.txHash.slice(0, 8)}...)`
  );
}
