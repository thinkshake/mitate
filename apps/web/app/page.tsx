"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarketCard } from "@/components/market-card";
import { useMarkets } from "@/hooks/useMarkets";
import { formatOdds, formatXrp, formatDeadline } from "@/lib/api";

const categories = [
  { id: "crypto", name: "Crypto", icon: "₿" },
  { id: "economics", name: "Economics", icon: "📈" },
  { id: "tech", name: "Technology", icon: "💻" },
  { id: "sports", name: "Sports", icon: "⚽" },
  { id: "politics", name: "Politics", icon: "🏛️" },
  { id: "entertainment", name: "Entertainment", icon: "🎬" },
];

export default function HomePage() {
  const { markets, loading, error } = useMarkets();

  // Transform API markets to display format
  const displayMarkets = markets.map((m) => {
    const odds = formatOdds(m);
    return {
      id: m.id,
      title: m.title,
      category: m.category || "other",
      yesPrice: odds.yes,
      noPrice: odds.no,
      volume: Number(m.poolTotalDrops),
      expiresAt: formatDeadline(m.bettingDeadline),
      description: m.description,
      status: m.status,
    };
  });

  const openMarkets = displayMarkets.filter((m) => m.status === "Open");
  const featuredMarkets = openMarkets.slice(0, 4);
  const trendingMarkets = [...openMarkets]
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 4);

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold text-black mb-6">
              Predict the Future on XRPL
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Bet on real-world outcomes using XRP. Parimutuel betting powered by
              XRPL's native features: Escrow, Issued Currency, DEX, and Multi-Sign.
            </p>
            <div className="flex space-x-4">
              <Link href="/markets">
                <Button size="lg" className="bg-black hover:bg-gray-800 text-white">
                  Explore Markets
                </Button>
              </Link>
              <Link href="/learn">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-gray-300 text-black hover:bg-gray-50"
                >
                  Learn How It Works
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-black mb-6">Browse Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <Link key={category.id} href={`/markets?category=${category.id}`}>
              <Card className="border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-sm cursor-pointer">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl mb-2">{category.icon}</div>
                  <div className="font-medium text-black">{category.name}</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Markets */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-black">Open Markets</h2>
          <Link href="/markets" className="text-gray-600 hover:text-black transition-colors">
            View all →
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8 text-gray-500">
            <p>Unable to load markets</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : featuredMarkets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredMarkets.map((market) => (
              <MarketCard key={market.id} market={market} featured />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No markets available yet</p>
            <p className="text-sm">Check back soon!</p>
          </div>
        )}
      </section>

      {/* Trending Markets */}
      {trendingMarkets.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-black">Trending by Volume</h2>
            <Link href="/markets" className="text-gray-600 hover:text-black transition-colors">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingMarkets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-black mb-8 text-center">
            How MITATE Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold text-black mb-2">Connect Wallet</h3>
              <p className="text-gray-600 text-sm">
                Connect your GemWallet on XRPL Testnet
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-black mb-2">Place Your Bet</h3>
              <p className="text-gray-600 text-sm">
                Bet XRP on YES or NO outcomes
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-black mb-2">Wait for Resolution</h3>
              <p className="text-gray-600 text-sm">
                Multi-sign committee resolves the outcome
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="font-semibold text-black mb-2">Collect Winnings</h3>
              <p className="text-gray-600 text-sm">
                Winners share the entire pool proportionally
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* XRPL Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-black mb-8 text-center">
          Powered by 6 XRPL Features
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { name: "Escrow", desc: "Time-locked pools" },
            { name: "Issued Currency", desc: "YES/NO tokens" },
            { name: "Trust Line", desc: "Token holding" },
            { name: "DEX", desc: "Secondary trading" },
            { name: "Multi-Sign", desc: "Resolution governance" },
            { name: "Memo", desc: "On-chain metadata" },
          ].map((feature) => (
            <Card key={feature.name} className="border border-gray-200">
              <CardContent className="p-4 text-center">
                <div className="font-semibold text-black">{feature.name}</div>
                <div className="text-xs text-gray-500">{feature.desc}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
