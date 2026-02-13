/**
 * XRPL transaction builders for MITATE prediction markets.
 *
 * Each builder returns a typed XRPL transaction object ready for
 * autofill() + sign + submit. All transactions include MITATE memos.
 */
import type {
  Payment,
  TrustSet,
  EscrowCreate,
  EscrowFinish,
  EscrowCancel,
  OfferCreate,
} from "xrpl";
import { encodeMemo, type MitateMemoData, type XrplMemo } from "./memo";

// ── Currency code encoding ─────────────────────────────────────────

/**
 * Encode a 160-bit (20-byte) non-standard XRPL currency code.
 *
 * Format: 0x02 prefix byte + up to 19 bytes of "<marketId>:<outcome>".
 * The 0x02 prefix ensures the first byte is non-zero (required by XRPL
 * to distinguish from 3-character standard currency codes).
 */
export function encodeCurrencyCode(
  marketId: string,
  outcome: "YES" | "NO"
): string {
  const label = `${marketId}:${outcome}`;
  const buf = Buffer.alloc(20, 0);
  buf[0] = 0x02; // non-standard currency marker
  const encoded = Buffer.from(label, "utf-8");
  encoded.copy(buf, 1, 0, Math.min(encoded.length, 19));
  return buf.toString("hex").toUpperCase();
}

/**
 * Decode a 160-bit currency code back to marketId + outcome.
 */
export function decodeCurrencyCode(
  hex: string
): { marketId: string; outcome: "YES" | "NO" } | null {
  try {
    const buf = Buffer.from(hex, "hex");
    if (buf.length !== 20 || buf[0] !== 0x02) return null;

    // Strip trailing zero bytes
    let end = 20;
    while (end > 1 && buf[end - 1] === 0) end--;

    const label = buf.subarray(1, end).toString("utf-8");
    const sep = label.lastIndexOf(":");
    if (sep === -1) return null;

    const marketId = label.substring(0, sep);
    const outcome = label.substring(sep + 1);
    if (outcome !== "YES" && outcome !== "NO") return null;

    return { marketId, outcome };
  } catch {
    return null;
  }
}

// ── Internal helpers ───────────────────────────────────────────────

function buildMemo(
  type: MitateMemoData["type"],
  marketId: string,
  extra?: Partial<Omit<MitateMemoData, "v" | "type" | "marketId" | "timestamp">>
): XrplMemo {
  return encodeMemo({
    v: 1,
    type,
    marketId,
    timestamp: new Date().toISOString(),
    ...extra,
  });
}

// ── Escrow builders ────────────────────────────────────────────────

export function buildEscrowCreate(params: {
  account: string;
  amountDrops: string;
  cancelAfter: number; // Ripple epoch seconds
  finishAfter?: number;
  marketId: string;
  destinationTag?: number;
}): EscrowCreate {
  // XRPL requires either Condition or FinishAfter
  // Set FinishAfter to now (allow immediate finish when market resolves)
  const rippleEpochOffset = 946684800;
  const nowRipple = Math.floor(Date.now() / 1000) - rippleEpochOffset;
  
  const tx: EscrowCreate = {
    TransactionType: "EscrowCreate",
    Account: params.account,
    Destination: params.account, // self-escrow pool
    Amount: params.amountDrops,
    CancelAfter: params.cancelAfter,
    FinishAfter: params.finishAfter ?? nowRipple, // Required by XRPL
    Memos: [buildMemo("escrow_pool", params.marketId)],
  };
  if (params.destinationTag !== undefined)
    tx.DestinationTag = params.destinationTag;
  return tx;
}

export function buildEscrowFinish(params: {
  account: string;
  offerSequence: number;
  marketId: string;
  outcome: "YES" | "NO";
}): EscrowFinish {
  return {
    TransactionType: "EscrowFinish",
    Account: params.account,
    Owner: params.account,
    OfferSequence: params.offerSequence,
    Memos: [buildMemo("resolve", params.marketId, { outcome: params.outcome })],
  };
}

export function buildEscrowCancel(params: {
  account: string;
  offerSequence: number;
  marketId: string;
}): EscrowCancel {
  return {
    TransactionType: "EscrowCancel",
    Account: params.account,
    Owner: params.account,
    OfferSequence: params.offerSequence,
    Memos: [buildMemo("cancel", params.marketId)],
  };
}

// ── Payment builders ───────────────────────────────────────────────

/** User -> Operator XRP bet payment (legacy YES/NO). */
export function buildBetPayment(params: {
  account: string;
  destination: string;
  amountDrops: string;
  marketId: string;
  outcome: "YES" | "NO";
}): Payment {
  return {
    TransactionType: "Payment",
    Account: params.account,
    Destination: params.destination,
    Amount: params.amountDrops,
    Memos: [
      buildMemo("bet", params.marketId, {
        outcome: params.outcome,
        amount: params.amountDrops,
      }),
    ],
  };
}

/** User -> Operator XRP bet payment for multi-outcome markets. */
export function buildOutcomeBetPayment(params: {
  account: string;
  destination: string;
  amountDrops: string;
  marketId: string;
  outcomeId: string;
}): Payment {
  return {
    TransactionType: "Payment",
    Account: params.account,
    Destination: params.destination,
    Amount: params.amountDrops,
    Memos: [
      buildMemo("bet", params.marketId, {
        outcomeId: params.outcomeId,
        amount: params.amountDrops,
      }),
    ],
  };
}

/** Issuer -> User IOU mint payment (legacy YES/NO). */
export function buildMintPayment(params: {
  issuerAddress: string;
  destination: string;
  marketId: string;
  outcome: "YES" | "NO";
  tokenValue: string;
}): Payment {
  return {
    TransactionType: "Payment",
    Account: params.issuerAddress,
    Destination: params.destination,
    Amount: {
      currency: encodeCurrencyCode(params.marketId, params.outcome),
      issuer: params.issuerAddress,
      value: params.tokenValue,
    },
    Memos: [
      buildMemo("mint", params.marketId, {
        outcome: params.outcome,
        amount: params.tokenValue,
      }),
    ],
  };
}

/** Issuer -> User IOU mint payment for multi-outcome markets. */
export function buildOutcomeMintPayment(params: {
  issuerAddress: string;
  destination: string;
  marketId: string;
  outcomeId: string;
  currencyCode: string;
  tokenValue: string;
}): Payment {
  return {
    TransactionType: "Payment",
    Account: params.issuerAddress,
    Destination: params.destination,
    Amount: {
      currency: params.currencyCode,
      issuer: params.issuerAddress,
      value: params.tokenValue,
    },
    Memos: [
      buildMemo("mint", params.marketId, {
        outcomeId: params.outcomeId,
        amount: params.tokenValue,
      }),
    ],
  };
}

/** Operator -> Winner XRP payout payment (legacy YES/NO). */
export function buildPayoutPayment(params: {
  operatorAddress: string;
  destination: string;
  amountDrops: string;
  marketId: string;
  outcome: "YES" | "NO";
}): Payment {
  return {
    TransactionType: "Payment",
    Account: params.operatorAddress,
    Destination: params.destination,
    Amount: params.amountDrops,
    Memos: [
      buildMemo("payout", params.marketId, {
        outcome: params.outcome,
        amount: params.amountDrops,
      }),
    ],
  };
}

/** Operator -> Winner XRP payout payment for multi-outcome markets. */
export function buildOutcomePayoutPayment(params: {
  operatorAddress: string;
  destination: string;
  amountDrops: string;
  marketId: string;
  outcomeId: string;
}): Payment {
  return {
    TransactionType: "Payment",
    Account: params.operatorAddress,
    Destination: params.destination,
    Amount: params.amountDrops,
    Memos: [
      buildMemo("payout", params.marketId, {
        outcomeId: params.outcomeId,
        amount: params.amountDrops,
      }),
    ],
  };
}

// ── TrustSet builders ──────────────────────────────────────────────

/** User sets trust line for outcome IOU (legacy YES/NO). */
export function buildTrustSet(params: {
  account: string;
  issuerAddress: string;
  marketId: string;
  outcome: "YES" | "NO";
  limitValue: string;
}): TrustSet {
  return {
    TransactionType: "TrustSet",
    Account: params.account,
    LimitAmount: {
      currency: encodeCurrencyCode(params.marketId, params.outcome),
      issuer: params.issuerAddress,
      value: params.limitValue,
    },
    Memos: [buildMemo("bet", params.marketId, { outcome: params.outcome })],
  };
}

/** User sets trust line for multi-outcome IOU. */
export function buildOutcomeTrustSet(params: {
  account: string;
  issuerAddress: string;
  marketId: string;
  outcomeId: string;
  currencyCode: string;
  limitValue: string;
}): TrustSet {
  return {
    TransactionType: "TrustSet",
    Account: params.account,
    LimitAmount: {
      currency: params.currencyCode,
      issuer: params.issuerAddress,
      value: params.limitValue,
    },
    Memos: [buildMemo("bet", params.marketId, { outcomeId: params.outcomeId })],
  };
}

// ── OfferCreate builder ────────────────────────────────────────────

/** User creates DEX offer to sell outcome IOUs for XRP. */
export function buildOfferCreate(params: {
  account: string;
  issuerAddress: string;
  marketId: string;
  outcome: "YES" | "NO";
  takerGetsTokenValue: string;
  takerPaysDrops: string;
  expiration?: number; // Ripple epoch seconds
}): OfferCreate {
  const tx: OfferCreate = {
    TransactionType: "OfferCreate",
    Account: params.account,
    TakerGets: {
      currency: encodeCurrencyCode(params.marketId, params.outcome),
      issuer: params.issuerAddress,
      value: params.takerGetsTokenValue,
    },
    TakerPays: params.takerPaysDrops,
    Memos: [
      buildMemo("offer", params.marketId, { outcome: params.outcome }),
    ],
  };
  if (params.expiration !== undefined) tx.Expiration = params.expiration;
  return tx;
}
