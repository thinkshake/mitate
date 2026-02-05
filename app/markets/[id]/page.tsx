"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { getMarketById, formatVolume, formatPrice, allMarkets } from "@/lib/mock-data";
import { MarketCard } from "@/components/market-card";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MarketDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const market = getMarketById(id);
  const [selectedSide, setSelectedSide] = useState<"yes" | "no">("yes");
  const [quantity, setQuantity] = useState(10);
  const [orderType, setOrderType] = useState<"market" | "limit">("market");

  if (!market) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-black mb-4">Market Not Found</h1>
        <Link href="/markets">
          <Button className="bg-black hover:bg-gray-800 text-white">
            Back to Markets
          </Button>
        </Link>
      </div>
    );
  }

  const price = selectedSide === "yes" ? market.yesPrice : market.noPrice;
  const cost = (price / 100) * quantity;
  const payout = quantity;
  const profit = payout - cost;

  const relatedMarkets = allMarkets
    .filter((m) => m.category === market.category && m.id !== market.id)
    .slice(0, 3);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-black">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/markets" className="hover:text-black">Markets</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">
          {market.category.charAt(0).toUpperCase() + market.category.slice(1)}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Market Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <Badge
                variant="secondary"
                className="bg-gray-100 text-gray-600 font-medium"
              >
                {market.category.charAt(0).toUpperCase() + market.category.slice(1)}
              </Badge>
              <span className="text-sm text-gray-500">
                Expires {market.expiresAt}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-black mb-4">{market.title}</h1>
            <p className="text-gray-600">{market.description}</p>
          </div>

          {/* Price Display */}
          <Card className="border border-gray-200 mb-8">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Yes Price</div>
                  <div className="text-4xl font-bold text-black">
                    {formatPrice(market.yesPrice)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {market.yesPrice}% chance
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">No Price</div>
                  <div className="text-4xl font-bold text-black">
                    {formatPrice(market.noPrice)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {market.noPrice}% chance
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-black rounded-full transition-all duration-300"
                    style={{ width: `${market.yesPrice}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Yes {market.yesPrice}%</span>
                  <span>No {market.noPrice}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Market Stats */}
          <Card className="border border-gray-200 mb-8">
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Volume</div>
                  <div className="text-xl font-semibold text-black">
                    {formatVolume(market.volume)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Expires</div>
                  <div className="text-xl font-semibold text-black">
                    {market.expiresAt}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Status</div>
                  <Badge className="bg-green-600 text-white hover:bg-green-600">
                    Open
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for additional info */}
          <Tabs defaultValue="about" className="mb-8">
            <TabsList className="bg-gray-100 p-1">
              <TabsTrigger
                value="about"
                className="data-[state=active]:bg-white data-[state=active]:text-black"
              >
                About
              </TabsTrigger>
              <TabsTrigger
                value="rules"
                className="data-[state=active]:bg-white data-[state=active]:text-black"
              >
                Rules
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="data-[state=active]:bg-white data-[state=active]:text-black"
              >
                Price History
              </TabsTrigger>
            </TabsList>
            <TabsContent value="about" className="mt-4">
              <Card className="border border-gray-200">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-black mb-3">
                    Market Description
                  </h3>
                  <p className="text-gray-600">{market.description}</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="rules" className="mt-4">
              <Card className="border border-gray-200">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-black mb-3">
                    Resolution Rules
                  </h3>
                  <ul className="text-gray-600 space-y-2">
                    <li>• This market will resolve based on official announcements</li>
                    <li>• Resolution will occur within 24 hours of the event</li>
                    <li>• In case of ambiguity, Kalshi reserves the right to resolve</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="history" className="mt-4">
              <Card className="border border-gray-200">
                <CardContent className="p-6">
                  <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                    Price history chart placeholder
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Trading Panel */}
        <div className="lg:col-span-1">
          <Card className="border border-gray-200 sticky top-24">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-black">Place Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Side Selection */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => setSelectedSide("yes")}
                  className={`
                    ${
                      selectedSide === "yes"
                        ? "bg-black text-white hover:bg-gray-800"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }
                  `}
                >
                  Yes {formatPrice(market.yesPrice)}
                </Button>
                <Button
                  onClick={() => setSelectedSide("no")}
                  className={`
                    ${
                      selectedSide === "no"
                        ? "bg-black text-white hover:bg-gray-800"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }
                  `}
                >
                  No {formatPrice(market.noPrice)}
                </Button>
              </div>

              <Separator className="bg-gray-200" />

              {/* Order Type */}
              <div>
                <label className="text-sm text-gray-500 mb-2 block">
                  Order Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    onClick={() => setOrderType("market")}
                    className={`
                      ${
                        orderType === "market"
                          ? "bg-black text-white hover:bg-gray-800"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }
                    `}
                  >
                    Market
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setOrderType("limit")}
                    className={`
                      ${
                        orderType === "limit"
                          ? "bg-black text-white hover:bg-gray-800"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }
                    `}
                  >
                    Limit
                  </Button>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="text-sm text-gray-500 mb-2 block">
                  Contracts
                </label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  min={1}
                  className="border-gray-300 focus:border-black focus:ring-black"
                />
              </div>

              <Separator className="bg-gray-200" />

              {/* Order Summary */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Price per contract</span>
                  <span className="text-black font-medium">{formatPrice(price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total cost</span>
                  <span className="text-black font-medium">${cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Potential payout</span>
                  <span className="text-black font-medium">${payout.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-700 font-medium">Potential profit</span>
                  <span className="text-green-600 font-semibold">
                    +${profit.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <Button className="w-full bg-black hover:bg-gray-800 text-white" size="lg">
                Buy {selectedSide.toUpperCase()} Contracts
              </Button>

              {/* Risk Warning */}
              <p className="text-xs text-gray-500 text-center">
                Trading involves risk. You may lose your entire investment.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Related Markets */}
      {relatedMarkets.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-black mb-6">Related Markets</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedMarkets.map((m) => (
              <MarketCard key={m.id} market={m} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
