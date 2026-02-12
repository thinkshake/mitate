"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MarketCard } from "@/components/market-card";
import { useMarkets } from "@/hooks/useMarkets";

const categories = [
  { id: "politics", name: "政治", icon: "🏛️" },
  { id: "economy", name: "経済", icon: "📈" },
  { id: "local", name: "地域", icon: "🗾" },
  { id: "culture", name: "文化", icon: "🎭" },
  { id: "tech", name: "テック", icon: "💻" },
  { id: "general", name: "その他", icon: "📋" },
];

export default function MarketsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { markets, loading, error, refetch } = useMarkets({
    category: selectedCategory || undefined,
  });

  const filteredMarkets = markets.filter((market) => {
    if (!searchQuery) return true;
    return (
      market.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      market.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-4"></div>
          <div className="h-4 bg-muted rounded w-96 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-muted rounded"></div>
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
          <h3 className="text-lg font-medium mb-2">マーケットの読み込みに失敗しました</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={refetch}>再試行</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">マーケット</h1>
        <p className="text-muted-foreground">
          XRPLで動く予測マーケットを閲覧・取引
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground"
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
              placeholder="マーケットを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
          >
            すべて
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
                selectedCategory === category.id ? null : category.id,
              )
            }
            className={`
              cursor-pointer transition-all duration-200
              ${
                selectedCategory === category.id
                  ? "border-primary bg-muted"
                  : "hover:border-muted-foreground/30 hover:shadow-sm"
              }
            `}
          >
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-1">{category.icon}</div>
              <div className="font-medium text-sm">{category.name}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground mb-4">
        {filteredMarkets.length}件のマーケット
        {selectedCategory && (
          <span>
            （
            <span className="font-medium text-foreground">
              {categories.find((c) => c.id === selectedCategory)?.name}
            </span>
            ）
          </span>
        )}
        {searchQuery && (
          <span>
            {" "}
            「
            <span className="font-medium text-foreground">{searchQuery}</span>
            」で検索中
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
          <h3 className="text-lg font-medium mb-2">
            マーケットが見つかりません
          </h3>
          <p className="text-muted-foreground mb-4">
            {markets.length === 0
              ? "まだマーケットが作成されていません"
              : "検索条件を変更してください"}
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedCategory(null);
              setSearchQuery("");
            }}
          >
            フィルターをクリア
          </Button>
        </div>
      )}
    </div>
  );
}
