/**
 * MITATE API client for frontend.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// ── Types ──────────────────────────────────────────────────────────

export interface Market {
  id: string;
  title: string;
  description: string;
  category: string | null;
  status: "Draft" | "Open" | "Closed" | "Resolved" | "Paid" | "Canceled" | "Stalled";
  outcome: "YES" | "NO" | null;
  bettingDeadline: string;
  resolutionTime: string | null;
  issuerAddress: string;
  operatorAddress: string;
  poolTotalDrops: string;
  yesTotalDrops: string;
  noTotalDrops: string;
  yes?: number;
  no?: number;
  xrplEscrowSequence: number | null;
}

export interface Bet {
  id: string;
  marketId: string;
  marketTitle?: string;
  outcome: "YES" | "NO";
  amountDrops: string;
  status: "Pending" | "Confirmed" | "Failed" | "Refunded";
  placedAt: string;
  paymentTx: string | null;
  mintTx: string | null;
  payout: string | null;
}

export interface Payout {
  id: string;
  marketId: string;
  marketTitle?: string;
  amountDrops: string;
  status: "Pending" | "Sent" | "Failed";
  payoutTx: string | null;
  createdAt: string;
}

export interface Trade {
  id: string;
  offerTx: string;
  takerGets: string;
  takerPays: string;
  executedAt: string;
  ledgerIndex: number;
}

export interface ApiError {
  code: string;
  message: string;
}

// ── Helper ─────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const json = await res.json();

  if (!res.ok) {
    const error = json.error as ApiError;
    throw new Error(error?.message || `API error: ${res.status}`);
  }

  return json.data as T;
}

// ── Markets ────────────────────────────────────────────────────────

export async function getMarkets(status?: string): Promise<Market[]> {
  const query = status ? `?status=${status}` : "";
  return apiFetch<Market[]>(`/markets${query}`);
}

export async function getOpenMarkets(): Promise<Market[]> {
  return apiFetch<Market[]>("/markets/open");
}

export async function getMarket(id: string): Promise<Market> {
  return apiFetch<Market>(`/markets/${id}`);
}

// ── Bets ───────────────────────────────────────────────────────────

export interface PlaceBetResponse {
  betId: string;
  status: string;
  potentialPayout: string;
  trustSet: unknown;
  payment: unknown;
}

export async function placeBet(
  marketId: string,
  outcome: "YES" | "NO",
  amountDrops: string,
  userAddress: string
): Promise<PlaceBetResponse> {
  return apiFetch<PlaceBetResponse>(`/markets/${marketId}/bets`, {
    method: "POST",
    body: JSON.stringify({ outcome, amountDrops, userAddress }),
  });
}

export async function confirmBet(
  marketId: string,
  betId: string,
  paymentTx: string
): Promise<{ betId: string; status: string }> {
  return apiFetch(`/markets/${marketId}/bets/confirm?betId=${betId}`, {
    method: "POST",
    body: JSON.stringify({ paymentTx }),
  });
}

export async function getBetsForMarket(marketId: string): Promise<Bet[]> {
  return apiFetch<Bet[]>(`/markets/${marketId}/bets`);
}

export async function getBetsForUser(address: string): Promise<Bet[]> {
  return apiFetch<Bet[]>(`/users/${address}/bets`);
}

export interface BetPreview {
  marketId: string;
  outcome: string;
  amountDrops: string;
  potentialPayout: string;
  impliedOdds: string;
  potentialReturn: string;
}

export async function previewBet(
  marketId: string,
  outcome: "YES" | "NO",
  amountDrops: string
): Promise<BetPreview> {
  return apiFetch<BetPreview>(
    `/markets/${marketId}/bets/preview?outcome=${outcome}&amountDrops=${amountDrops}`
  );
}

// ── Trades ─────────────────────────────────────────────────────────

export interface CreateOfferResponse {
  offer: unknown;
}

export async function createOffer(
  marketId: string,
  outcome: "YES" | "NO",
  side: "buy" | "sell",
  tokenAmount: string,
  xrpAmountDrops: string,
  userAddress: string
): Promise<CreateOfferResponse> {
  return apiFetch<CreateOfferResponse>(`/markets/${marketId}/offers`, {
    method: "POST",
    body: JSON.stringify({ outcome, side, tokenAmount, xrpAmountDrops, userAddress }),
  });
}

export interface TradesResponse {
  trades: Trade[];
  stats: {
    tradeCount: number;
    volumeDrops: string;
  };
}

export async function getTradesForMarket(marketId: string): Promise<TradesResponse> {
  return apiFetch<TradesResponse>(`/markets/${marketId}/trades`);
}

// ── Payouts ────────────────────────────────────────────────────────

export async function getPayoutsForMarket(marketId: string): Promise<{
  payouts: Payout[];
  stats: {
    total: number;
    pending: number;
    sent: number;
    failed: number;
    totalDrops: string;
    sentDrops: string;
  };
}> {
  return apiFetch(`/markets/${marketId}/payouts`);
}

export async function getPayoutsForUser(address: string): Promise<Payout[]> {
  return apiFetch<Payout[]>(`/users/${address}/payouts`);
}

// ── Formatting Helpers ─────────────────────────────────────────────

export function dropsToXrp(drops: string): number {
  return Number(drops) / 1_000_000;
}

export function xrpToDrops(xrp: number): string {
  return Math.floor(xrp * 1_000_000).toString();
}

export function formatXrp(drops: string): string {
  const xrp = dropsToXrp(drops);
  if (xrp >= 1000) {
    return `${(xrp / 1000).toFixed(1)}K XRP`;
  }
  return `${xrp.toFixed(2)} XRP`;
}

export function formatOdds(market: Market): { yes: number; no: number } {
  const yesTotal = BigInt(market.yesTotalDrops);
  const noTotal = BigInt(market.noTotalDrops);
  const total = yesTotal + noTotal;

  if (total === BigInt(0)) {
    return { yes: 50, no: 50 };
  }

  return {
    yes: Math.round((Number(yesTotal) / Number(total)) * 100),
    no: Math.round((Number(noTotal) / Number(total)) * 100),
  };
}

export function formatDeadline(deadline: string): string {
  const date = new Date(deadline);
  const now = new Date();
  const diff = date.getTime() - now.getTime();

  if (diff <= 0) {
    return "Closed";
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) {
    return `${days}d ${hours}h left`;
  }
  if (hours > 0) {
    return `${hours}h left`;
  }

  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${minutes}m left`;
}
