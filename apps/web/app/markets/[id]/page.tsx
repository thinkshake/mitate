"use client";

import { use, useState } from "react";
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
  formatXrp,
  formatOdds,
  formatDeadline,
  xrpToDrops,
  dropsToXrp,
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
  const poolXrp = dropsToXrp(market.poolTotalDrops);
  const amountDrops = xrpToDrops(parseFloat(xrpAmount) || 0);
  const selectedOdds = selectedSide === "YES" ? odds.yes : odds.no;

  // Estimate payout (simplified parimutuel)
  const estimatedPayout =
    selectedOdds > 0
      ? (parseFloat(xrpAmount) || 0) * (100 / selectedOdds)
      : parseFloat(xrpAmount) || 0;

  const handlePlaceBet = async () => {
    if (!wallet.connected || !wallet.address) {
      wallet.connect("xaman");
      return;
    }

    setBetLoading(true);
    setBetError(null);
    setBetSuccess(null);

    try {
      // 1. Create bet intent
      const result = await placeBet(id, selectedSide, amountDrops, wallet.address);

      // 2. Sign TrustSet if needed (first time betting on this outcome)
      if (result.trustSet) {
        const trustTxHash = await wallet.signTransaction(result.trustSet);
        if (!trustTxHash) {
          throw new Error("TrustSet transaction was not signed");
        }
        // Wait a moment for the trust line to be established
        await new Promise((r) => setTimeout(r, 2000));
      }

      // 3. Sign Payment
      const paymentTxHash = await wallet.signTransaction(result.payment);
      if (!paymentTxHash) {
        throw new Error("Payment transaction was not signed");
      }

      // 4. Confirm bet
      await confirmBet(id, result.betId, paymentTxHash);

      setBetSuccess(`Bet placed successfully! Potential payout: ${formatXrp(result.potentialPayout)}`);
      refetch();
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
                  <div className="text-4xl font-bold text-black">{odds.yes}%</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {formatXrp(market.yesTotalDrops)} pool
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">No</div>
                  <div className="text-4xl font-bold text-black">{odds.no}%</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {formatXrp(market.noTotalDrops)} pool
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-black rounded-full transition-all duration-300"
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
              <TabsTrigger value="rules" className="data-[state=active]:bg-white">
                Rules
              </TabsTrigger>
              <TabsTrigger value="xrpl" className="data-[state=active]:bg-white">
                XRPL Details
              </TabsTrigger>
            </TabsList>
            <TabsContent value="about" className="mt-4">
              <Card className="border border-gray-200">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-black mb-3">Description</h3>
                  <p className="text-gray-600">{market.description}</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="rules" className="mt-4">
              <Card className="border border-gray-200">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-black mb-3">Parimutuel Rules</h3>
                  <ul className="text-gray-600 space-y-2">
                    <li>• All bets on the winning outcome share the total pool</li>
                    <li>• Payout = (Your Bet / Total Winning Bets) × Total Pool</li>
                    <li>• Resolution requires 2-of-3 multi-sign approval</li>
                    <li>• Payouts are executed in XRP on XRPL</li>
                  </ul>
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
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-gray-700 font-medium">Est. payout if win</span>
                      <span className="text-green-600 font-semibold">
                        ~{estimatedPayout.toFixed(2)} XRP
                      </span>
                    </div>
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
                      : "Connect Wallet"}
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
