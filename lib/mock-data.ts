// Mock data for the prediction market prototype

export interface Market {
  id: string;
  title: string;
  category: string;
  yesPrice: number; // 0-100 cents
  noPrice: number;
  volume: number;
  expiresAt: string;
  description: string;
  image?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
}

export const categories: Category[] = [
  { id: "politics", name: "Politics", icon: "🏛️", count: 42 },
  { id: "economics", name: "Economics", icon: "📈", count: 28 },
  { id: "tech", name: "Technology", icon: "💻", count: 35 },
  { id: "sports", name: "Sports", icon: "⚽", count: 21 },
  { id: "crypto", name: "Crypto", icon: "₿", count: 18 },
  { id: "entertainment", name: "Entertainment", icon: "🎬", count: 15 },
];

export const featuredMarkets: Market[] = [
  {
    id: "btc-100k-2025",
    title: "Will Bitcoin reach $100,000 by end of 2025?",
    category: "crypto",
    yesPrice: 67,
    noPrice: 33,
    volume: 2450000,
    expiresAt: "Dec 31, 2025",
    description: "This market resolves YES if the price of Bitcoin (BTC/USD) reaches or exceeds $100,000 at any point before December 31, 2025 11:59 PM ET.",
  },
  {
    id: "fed-rate-cut",
    title: "Will the Fed cut rates in Q1 2025?",
    category: "economics",
    yesPrice: 42,
    noPrice: 58,
    volume: 1850000,
    expiresAt: "Mar 31, 2025",
    description: "This market resolves YES if the Federal Reserve announces a rate cut during Q1 2025.",
  },
  {
    id: "apple-ai-iphone",
    title: "Will Apple announce AI features for iPhone 17?",
    category: "tech",
    yesPrice: 89,
    noPrice: 11,
    volume: 980000,
    expiresAt: "Sep 30, 2025",
    description: "This market resolves YES if Apple announces significant AI features for iPhone 17 at the 2025 September event.",
  },
  {
    id: "superbowl-chiefs",
    title: "Will the Chiefs win Super Bowl 2026?",
    category: "sports",
    yesPrice: 23,
    noPrice: 77,
    volume: 3200000,
    expiresAt: "Feb 8, 2026",
    description: "This market resolves YES if the Kansas City Chiefs win Super Bowl LX in 2026.",
  },
];

export const allMarkets: Market[] = [
  ...featuredMarkets,
  {
    id: "eth-merge-upgrade",
    title: "Will Ethereum complete the next major upgrade by Q2 2025?",
    category: "crypto",
    yesPrice: 71,
    noPrice: 29,
    volume: 890000,
    expiresAt: "Jun 30, 2025",
    description: "This market resolves YES if Ethereum completes a major network upgrade by Q2 2025.",
  },
  {
    id: "inflation-3pct",
    title: "Will US inflation fall below 3% by March 2025?",
    category: "economics",
    yesPrice: 55,
    noPrice: 45,
    volume: 1200000,
    expiresAt: "Mar 31, 2025",
    description: "This market resolves YES if the CPI-reported inflation rate falls below 3% by March 2025.",
  },
  {
    id: "tesla-robotaxi",
    title: "Will Tesla launch Robotaxi service in 2025?",
    category: "tech",
    yesPrice: 34,
    noPrice: 66,
    volume: 1500000,
    expiresAt: "Dec 31, 2025",
    description: "This market resolves YES if Tesla commercially launches its Robotaxi service in any US market during 2025.",
  },
  {
    id: "oscar-best-picture",
    title: "Will a streaming-only film win Best Picture 2025?",
    category: "entertainment",
    yesPrice: 28,
    noPrice: 72,
    volume: 450000,
    expiresAt: "Mar 2, 2025",
    description: "This market resolves YES if a film exclusively released on a streaming platform wins Best Picture at the 2025 Academy Awards.",
  },
  {
    id: "us-recession-2025",
    title: "Will the US enter a recession in 2025?",
    category: "economics",
    yesPrice: 18,
    noPrice: 82,
    volume: 2100000,
    expiresAt: "Dec 31, 2025",
    description: "This market resolves YES if the NBER declares a recession starting in 2025.",
  },
  {
    id: "world-cup-usa",
    title: "Will USA reach World Cup 2026 semifinals?",
    category: "sports",
    yesPrice: 31,
    noPrice: 69,
    volume: 780000,
    expiresAt: "Jul 19, 2026",
    description: "This market resolves YES if the US Men's National Team reaches the semifinals of the 2026 FIFA World Cup.",
  },
];

export function getMarketById(id: string): Market | undefined {
  return allMarkets.find((m) => m.id === id);
}

export function getMarketsByCategory(category: string): Market[] {
  return allMarkets.filter((m) => m.category === category);
}

export function formatVolume(volume: number): string {
  if (volume >= 1000000) {
    return `$${(volume / 1000000).toFixed(1)}M`;
  }
  if (volume >= 1000) {
    return `$${(volume / 1000).toFixed(0)}K`;
  }
  return `$${volume}`;
}

export function formatPrice(cents: number): string {
  return `${cents}¢`;
}
