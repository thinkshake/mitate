"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarketCard } from "@/components/market-card";
import { categories, featuredMarkets, allMarkets } from "@/lib/mock-data";

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold text-black mb-6">
              Trade on the Future
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Buy and sell contracts on real-world events. Politics, economics,
              sports, and more. Regulated and transparent.
            </p>
            <div className="flex space-x-4">
              <Link href="/markets">
                <Button size="lg" className="bg-black hover:bg-gray-800 text-white">
                  Explore Markets
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-gray-300 text-black hover:bg-gray-50"
              >
                Learn How It Works
              </Button>
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
                  <div className="text-sm text-gray-500">{category.count} markets</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Markets */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-black">Featured Markets</h2>
          <Link href="/markets" className="text-gray-600 hover:text-black transition-colors">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredMarkets.map((market) => (
            <MarketCard key={market.id} market={market} featured />
          ))}
        </div>
      </section>

      {/* Trending Markets */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-black">Trending Now</h2>
          <Link href="/markets" className="text-gray-600 hover:text-black transition-colors">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allMarkets.slice(4, 10).map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-black mb-8 text-center">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold text-black mb-2">Find a Market</h3>
              <p className="text-gray-600">
                Browse thousands of markets across politics, economics, sports, and more.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-black mb-2">Buy Contracts</h3>
              <p className="text-gray-600">
                Buy Yes or No contracts at the current market price. Pay from 1¢ to 99¢.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-black mb-2">Get Paid</h3>
              <p className="text-gray-600">
                If you're right, your contracts pay out $1 each. If not, they expire worthless.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
