"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useMarket } from "@/hooks/useMarkets";
import { useWallet } from "@/contexts/WalletContext";
import {
  placeBet,
  confirmBet,
  previewBet,
  getBetsForMarket,
  formatXrp,
  formatOdds,
  formatDeadline,
  xrpToDrops,
  dropsToXrp,
  type Bet,
} from "@/lib/api";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MarketDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { market, loading, error, refetch } = useMarket(id);
  const wallet = useWallet();

  const [selectedSide, setSelectedSide] = useState<"YES" | "NO">("YES");
  const [xrpAmount, setXrpAmount] = useState("10");
  const [betLoading, setBetLoading] = useState(false);
  const [betError, setBetError] = useState<string | null>(null);
  const [betSuccess, setBetSuccess] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    potentialPayout: string;
    impliedOdds: string;
  } | null>(null);
  const [recentBets, setRecentBets] = useState<Bet[]>([]);

  // Fetch bet preview when amount or side changes
  useEffect(() => {
    if (!id || !xrpAmount || parseFloat(xrpAmount) <= 0) {
      setPreview(null);
      return;
    }

    const fetchPreview = async () => {
      try {
        const amountDrops = xrpToDrops(parseFloat(xrpAmount));
        const data = await previewBet(id, selectedSide, amountDrops);
        setPreview({
          potentialPayout: data.potentialPayout,
          impliedOdds: data.impliedOdds,
        });
      } catch (err) {
        setPreview(null);
      }
    };

    const debounce = setTimeout(fetchPreview, 300);
    return () => clearTimeout(debounce);
  }, [id, xrpAmount, selectedSide]);

  // Fetch recent bets for this market
  useEffect(() => {
    if (!id) return;
    getBetsForMarket(id)
      .then((bets) => setRecentBets(bets.slice(0, 5)))
      .catch(() => setRecentBets([]));
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-black mb-4">
          {error || "Market Not Found"}
        </h1>
        <Link href="/markets">
          <Button className="bg-black hover:bg-gray-800 text-white">
            Back to Markets
          </Button>
        </Link>
      </div>
    );
  }

  const odds = formatOdds(market);
  const selectedOdds = selectedSide === "YES" ? odds.yes : odds.no;

  const handlePlaceBet = async () => {
    if (!wallet.connected || !wallet.address) {
      wallet.connect();
      return;
    }

    setBetLoading(true);
    setBetError(null);
    setBetSuccess(null);

    try {
      const amountDrops = xrpToDrops(parseFloat(xrpAmount));

      // 1. Create bet intent - get tx payloads from backend
      const result = await placeBet(id, selectedSide, amountDrops, wallet.address);

      // 2. Sign and submit TrustSet if needed
      if (result.trustSet) {
        const trustResult = await wallet.signAndSubmitTransaction(result.trustSet);
        if (!trustResult?.hash) {
          throw new Error("TrustSet transaction was rejected");
        }
        // Wait for TrustSet to be validated
        await new Promise((r) => setTimeout(r, 4000));
      }

      // 3. Sign and submit Payment
      const paymentResult = await wallet.signAndSubmitTransaction(result.payment);
      if (!paymentResult?.hash) {
        throw new Error("Payment transaction was rejected");
      }

      // 4. Confirm bet with backend
      await confirmBet(id, result.betId, paymentResult.hash);

      setBetSuccess(
        `Bet placed! Tx: ${paymentResult.hash.slice(0, 8)}... Potential payout: ${formatXrp(result.potentialPayout)}`
      );

      // Refresh market data and bets
      refetch();
      const bets = await getBetsForMarket(id);
      setRecentBets(bets.slice(0, 5));
    } catch (err) {
      setBetError(err instanceof Error ? err.message : "Failed to place bet");
    } finally {
      setBetLoading(false);
    }
  };

  const statusColor = {
    Draft: "bg-gray-500",
    Open: "bg-green-600",
    Closed: "bg-yellow-600",
    Resolved: "bg-blue-600",
    Paid: "bg-purple-600",
    Canceled: "bg-red-600",
    Stalled: "bg-orange-600",
  }[market.status] || "bg-gray-500";

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-black">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/markets" className="hover:text-black">Markets</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">{market.category || "Other"}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Market Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <Badge variant="secondary" className="bg-gray-100 text-gray-600 font-medium">
                {market.category || "Other"}
              </Badge>
              <Badge className={`${statusColor} text-white`}>
                {market.status}
              </Badge>
              <span className="text-sm text-gray-500">
                {formatDeadline(market.bettingDeadline)}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-black mb-4">{market.title}</h1>
            <p className="text-gray-600">{market.description}</p>
          </div>

          {/* Odds Display */}
          <Card className="border border-gray-200 mb-8">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Yes</div>
                  <div className="text-4xl font-bold text-green-600">{odds.yes}%</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {formatXrp(market.yesTotalDrops)} pool
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">No</div>
                  <div className="text-4xl font-bold text-red-600">{odds.no}%</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {formatXrp(market.noTotalDrops)} pool
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <div className="h-4 bg-red-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-300"
                    style={{ width: `${odds.yes}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Yes {odds.yes}%</span>
                  <span>No {odds.no}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Market Stats */}
          <Card className="border border-gray-200 mb-8">
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Total Pool</div>
                  <div className="text-xl font-semibold text-black">
                    {formatXrp(market.poolTotalDrops)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Deadline</div>
                  <div className="text-xl font-semibold text-black">
                    {new Date(market.bettingDeadline).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Outcome</div>
                  <div className="text-xl font-semibold text-black">
                    {market.outcome || "—"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="about" className="mb-8">
            <TabsList className="bg-gray-100 p-1">
              <TabsTrigger value="about" className="data-[state=active]:bg-white">
                About
              </TabsTrigger>
              <TabsTrigger value="bets" className="data-[state=active]:bg-white">
                Recent Bets
              </TabsTrigger>
              <TabsTrigger value="xrpl" className="data-[state=active]:bg-white">
                XRPL Details
              </TabsTrigger>
            </TabsList>
            <TabsContent value="about" className="mt-4">
              <Card className="border border-gray-200">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-black mb-3">Description</h3>
                  <p className="text-gray-600 mb-4">{market.description}</p>
                  <h3 className="font-semibold text-black mb-3">Parimutuel Rules</h3>
                  <ul className="text-gray-600 space-y-2 text-sm">
                    <li>• All bets on the winning outcome share the total pool</li>
                    <li>• Payout = (Your Bet / Total Winning Bets) × Total Pool</li>
                    <li>• Resolution requires 2-of-3 multi-sign approval</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="bets" className="mt-4">
              <Card className="border border-gray-200">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-black mb-3">Recent Bets</h3>
                  {recentBets.length === 0 ? (
                    <p className="text-gray-500 text-sm">No bets yet</p>
                  ) : (
                    <div className="space-y-3">
                      {recentBets.map((bet) => (
                        <div
                          key={bet.id}
                          className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                        >
                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                bet.outcome === "YES"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {bet.outcome}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {bet.userId?.slice(0, 8)}...
                            </span>
                          </div>
                          <span className="font-medium">
                            {formatXrp(bet.amountDrops)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="xrpl" className="mt-4">
              <Card className="border border-gray-200">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-black mb-3">On-Chain Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Operator</span>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {market.operatorAddress}
                      </code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Issuer</span>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {market.issuerAddress}
                      </code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Escrow Sequence</span>
                      <span className="text-black">{market.xrplEscrowSequence || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Market ID</span>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {market.id}
                      </code>
                    </div>
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
              <CardTitle className="text-lg text-black">Place Bet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {market.status !== "Open" ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-2">This market is {market.status.toLowerCase()}</p>
                  {market.outcome && (
                    <p className="text-lg font-semibold text-black">
                      Resolved: {market.outcome}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {/* Side Selection */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => setSelectedSide("YES")}
                      className={
                        selectedSide === "YES"
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }
                    >
                      Yes {odds.yes}%
                    </Button>
                    <Button
                      onClick={() => setSelectedSide("NO")}
                      className={
                        selectedSide === "NO"
                          ? "bg-red-600 text-white hover:bg-red-700"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }
                    >
                      No {odds.no}%
                    </Button>
                  </div>

                  <Separator className="bg-gray-200" />

                  {/* Amount */}
                  <div>
                    <label className="text-sm text-gray-500 mb-2 block">
                      Bet Amount (XRP)
                    </label>
                    <Input
                      type="number"
                      value={xrpAmount}
                      onChange={(e) => setXrpAmount(e.target.value)}
                      min={1}
                      step={1}
                      className="border-gray-300 focus:border-black focus:ring-black"
                    />
                    <div className="flex gap-2 mt-2">
                      {[10, 50, 100, 500].map((amt) => (
                        <Button
                          key={amt}
                          size="sm"
                          variant="outline"
                          onClick={() => setXrpAmount(String(amt))}
                          className="flex-1 text-xs"
                        >
                          {amt}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Separator className="bg-gray-200" />

                  {/* Summary */}
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Your bet</span>
                      <span className="text-black font-medium">
                        {xrpAmount} XRP on {selectedSide}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Current odds</span>
                      <span className="text-black font-medium">{selectedOdds}%</span>
                    </div>
                    {preview && (
                      <div className="flex justify-between pt-2 border-t border-gray-200">
                        <span className="text-gray-700 font-medium">Est. payout if win</span>
                        <span className="text-green-600 font-semibold">
                          {formatXrp(preview.potentialPayout)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Errors/Success */}
                  {betError && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded">
                      {betError}
                    </div>
                  )}
                  {betSuccess && (
                    <div className="p-3 bg-green-50 text-green-600 text-sm rounded">
                      {betSuccess}
                    </div>
                  )}

                  {/* Submit */}
                  <Button
                    className="w-full bg-black hover:bg-gray-800 text-white"
                    size="lg"
                    onClick={handlePlaceBet}
                    disabled={betLoading || parseFloat(xrpAmount) <= 0}
                  >
                    {betLoading
                      ? "Processing..."
                      : wallet.connected
                      ? `Bet ${xrpAmount} XRP on ${selectedSide}`
                      : "Connect GemWallet"}
                  </Button>

                  {/* Wallet Status */}
                  {wallet.connected && (
                    <p className="text-xs text-gray-500 text-center">
                      Connected: {wallet.address?.slice(0, 8)}...{wallet.address?.slice(-6)}
                    </p>
                  )}

                  <p className="text-xs text-gray-500 text-center">
                    Bets are final. Payouts distributed after resolution.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
