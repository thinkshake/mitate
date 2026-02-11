"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MarketCard } from "@/components/market-card";
import { useMarkets } from "@/hooks/useMarkets";
import { formatOdds, formatXrp, formatDeadline, type Market } from "@/lib/api";

// Categories for filtering (could be fetched from API in future)
const categories = [
  { id: "crypto", name: "Crypto", icon: "₿" },
  { id: "economics", name: "Economics", icon: "📈" },
  { id: "tech", name: "Technology", icon: "💻" },
  { id: "sports", name: "Sports", icon: "⚽" },
  { id: "politics", name: "Politics", icon: "🏛️" },
  { id: "entertainment", name: "Entertainment", icon: "🎬" },
];

export default function MarketsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { markets, loading, error, refetch } = useMarkets();

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

  const filteredMarkets = displayMarkets.filter((market) => {
    const matchesCategory = !selectedCategory || market.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      market.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      market.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load markets</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={refetch} className="bg-black text-white hover:bg-gray-800">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">Markets</h1>
        <p className="text-gray-600">
          Browse and trade on prediction markets powered by XRPL
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <Input
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-gray-300 focus:border-black focus:ring-black"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
            className={
              selectedCategory === null
                ? "bg-black text-white hover:bg-gray-800"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }
          >
            All
          </Button>
        </div>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {categories.map((category) => (
          <Card
            key={category.id}
            onClick={() =>
              setSelectedCategory(
                selectedCategory === category.id ? null : category.id
              )
            }
            className={`
              cursor-pointer transition-all duration-200
              ${
                selectedCategory === category.id
                  ? "border-black bg-gray-50"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
              }
            `}
          >
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-1">{category.icon}</div>
              <div className="font-medium text-black text-sm">{category.name}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-500 mb-4">
        {filteredMarkets.length} market{filteredMarkets.length !== 1 ? "s" : ""}{" "}
        {selectedCategory && (
          <span>
            in{" "}
            <span className="text-black font-medium">
              {categories.find((c) => c.id === selectedCategory)?.name}
            </span>
          </span>
        )}
        {searchQuery && (
          <span>
            {" "}
            matching &ldquo;<span className="text-black font-medium">{searchQuery}</span>&rdquo;
          </span>
        )}
      </div>

      {/* Markets Grid */}
      {filteredMarkets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMarkets.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No markets found
          </h3>
          <p className="text-gray-500 mb-4">
            {markets.length === 0
              ? "No markets have been created yet"
              : "Try adjusting your search or filter criteria"}
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedCategory(null);
              setSearchQuery("");
            }}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
