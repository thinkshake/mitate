"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
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

export default function HomePage() {
  const { markets, loading, error } = useMarkets();

  const openMarkets = markets.filter((m) => m.status === "open");
  const featuredMarkets = openMarkets.slice(0, 4);
  const trendingMarkets = [...openMarkets]
    .sort((a, b) => Number(b.totalPoolDrops) - Number(a.totalPoolDrops))
    .slice(0, 4);

  return (
    <div>
      {/* Hero Section */}
      <section className="border-b border-border">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold mb-6">
              XRPLで未来を予測しよう
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              XRPを使って実世界の結果に賭けよう。エスクロー、発行通貨、DEX、マルチサインを活用したパリミュチュエル方式の予測マーケット。
            </p>
            <div className="flex space-x-4">
              <Link href="/markets">
                <Button size="lg">
                  マーケットを探す
                </Button>
              </Link>
              <Link href="/learn">
                <Button size="lg" variant="outline">
                  使い方を学ぶ
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6">カテゴリ一覧</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <Link key={category.id} href={`/markets?category=${category.id}`}>
              <Card className="hover:border-muted-foreground/30 transition-all duration-200 hover:shadow-sm cursor-pointer">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl mb-2">{category.icon}</div>
                  <div className="font-medium">{category.name}</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Markets */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">オープンマーケット</h2>
          <Link
            href="/markets"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            すべて見る →
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-48 bg-muted rounded animate-pulse"
              ></div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>マーケットを読み込めませんでした</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : featuredMarkets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredMarkets.map((market) => (
              <MarketCard key={market.id} market={market} featured />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>まだマーケットがありません</p>
            <p className="text-sm">もうしばらくお待ちください！</p>
          </div>
        )}
      </section>

      {/* Trending Markets */}
      {trendingMarkets.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">取引量ランキング</h2>
            <Link
              href="/markets"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              すべて見る →
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
      <section className="bg-muted py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">
            MITATEの使い方
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold mb-2">ウォレット接続</h3>
              <p className="text-muted-foreground text-sm">
                GemWalletをXRPL Testnetに接続
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold mb-2">予測する</h3>
              <p className="text-muted-foreground text-sm">
                XRPで好きな結果に賭ける
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold mb-2">結果を待つ</h3>
              <p className="text-muted-foreground text-sm">
                マルチサイン委員会が結果を確定
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="font-semibold mb-2">報酬を受け取る</h3>
              <p className="text-muted-foreground text-sm">
                勝者がプール全体を按分で獲得
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* XRPL Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold mb-8 text-center">
          6つのXRPL機能を活用
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { name: "Escrow", desc: "時限プール" },
            { name: "Issued Currency", desc: "結果トークン" },
            { name: "Trust Line", desc: "トークン保有" },
            { name: "DEX", desc: "セカンダリ取引" },
            { name: "Multi-Sign", desc: "解決ガバナンス" },
            { name: "Memo", desc: "オンチェーンメタデータ" },
          ].map((feature) => (
            <Card key={feature.name}>
              <CardContent className="p-4 text-center">
                <div className="font-semibold">{feature.name}</div>
                <div className="text-xs text-muted-foreground">
                  {feature.desc}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
