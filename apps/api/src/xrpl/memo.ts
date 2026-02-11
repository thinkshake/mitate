/**
 * MITATE memo encoding/decoding for XRPL transactions.
 *
 * All MITATE transactions carry a Memo with:
 *   MemoType  = hex("MITATE")
 *   MemoFormat = hex("application/json")
 *   MemoData  = hex(JSON)
 */

// ── Types ──────────────────────────────────────────────────────────

export type MitateMemoType =
  | "market"
  | "bet"
  | "mint"
  | "offer"
  | "resolve"
  | "payout"
  | "cancel"
  | "escrow_pool"
  | "burn";

export interface MitateMemoData {
  v: 1;
  type: MitateMemoType;
  marketId: string;
  outcome?: "YES" | "NO";
  amount?: string;
  creator?: string;
  timestamp: string;
}

export interface XrplMemo {
  Memo: {
    MemoType: string;
    MemoFormat: string;
    MemoData: string;
  };
}

// ── Constants ──────────────────────────────────────────────────────

const MEMO_TYPE = "MITATE";
const MEMO_FORMAT = "application/json";

// ── Hex helpers ────────────────────────────────────────────────────

export function toHex(str: string): string {
  return Buffer.from(str, "utf-8").toString("hex").toUpperCase();
}

export function fromHex(hex: string): string {
  return Buffer.from(hex, "hex").toString("utf-8");
}

// ── Encode / Decode ────────────────────────────────────────────────

/**
 * Encode a MitateMemoData object into an XRPL Memo field.
 */
export function encodeMemo(data: MitateMemoData): XrplMemo {
  return {
    Memo: {
      MemoType: toHex(MEMO_TYPE),
      MemoFormat: toHex(MEMO_FORMAT),
      MemoData: toHex(JSON.stringify(data)),
    },
  };
}

/**
 * Decode an XRPL Memo field back into MitateMemoData.
 * Returns null if the memo is not a valid MITATE memo.
 */
export function decodeMemo(memo: XrplMemo): MitateMemoData | null {
  try {
    const memoType = fromHex(memo.Memo.MemoType);
    if (memoType !== MEMO_TYPE) return null;

    const raw = JSON.parse(fromHex(memo.Memo.MemoData));
    if (raw.v !== 1) return null;

    return raw as MitateMemoData;
  } catch {
    return null;
  }
}

/**
 * Check if an XRPL Memo is a MITATE memo (without full decode).
 */
export function isMitateMemo(memo: XrplMemo): boolean {
  try {
    return fromHex(memo.Memo.MemoType) === MEMO_TYPE;
  } catch {
    return false;
  }
}
