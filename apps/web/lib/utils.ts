import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Currency Formatting (XRP) ──────────────────────────────────────

export function formatXrp(drops: string | number): string {
  const xrp = Number(drops) / 1_000_000;
  return `${xrp.toLocaleString("ja-JP")} XRP`;
}

export function formatXrpCompact(drops: string | number): string {
  const xrp = Number(drops) / 1_000_000;
  if (xrp >= 1000) return `${(xrp / 1000).toFixed(1)}K XRP`;
  return `${xrp.toFixed(0)} XRP`;
}

export function xrpToDrops(xrp: number): string {
  return String(Math.floor(xrp * 1_000_000));
}

export function dropsToXrp(drops: string | number): number {
  return Number(drops) / 1_000_000;
}
