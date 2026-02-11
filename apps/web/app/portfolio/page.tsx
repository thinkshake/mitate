"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWallet } from "@/contexts/WalletContext";
import { getBetsForUser, getPayoutsForUser, formatXrp, type Bet, type Payout } from "@/lib/api";

export default function PortfolioPage() {
  const wallet = useWallet();
  const [bets, setBets] = useState<Bet[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (wallet.connected && wallet.address) {
      setLoading(true);
      setError(null);
      Promise.all([
        getBetsForUser(wallet.address),
        getPayoutsForUser(wallet.address),
      ])
        .then(([betsData, payoutsData]) => {
          setBets(betsData);
          setPayouts(payoutsData);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Failed to load data");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [wallet.connected, wallet.address]);

  if (!wallet.connected) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-black mb-4">Connect Your Wallet</h1>
          <p className="text-gray-600 mb-8">
            Connect your XRPL wallet to view your portfolio, bets, and payouts.
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => wallet.connect("xaman")}
              className="w-full bg-black hover:bg-gray-800 text-white"
              size="lg"
            >
              Connect with Xaman
            </Button>
            <Button
              onClick={() => wallet.connect("gemwallet")}
              variant="outline"
              className="w-full border-gray-300"
              size="lg"
            >
              Connect with GemWallet
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const confirmedBets = bets.filter((b) => b.status === "Confirmed");
  const pendingBets = bets.filter((b) => b.status === "Pending");
  const totalBetDrops = confirmedBets.reduce(
    (sum, b) => sum + BigInt(b.amountDrops),
    BigInt(0)
  );
  const totalPayoutDrops = payouts
    .filter((p) => p.status === "Sent")
    .reduce((sum, p) => sum + BigInt(p.amountDrops), BigInt(0));

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Pending: "bg-yellow-100 text-yellow-800",
      Confirmed: "bg-green-100 text-green-800",
      Failed: "bg-red-100 text-red-800",
      Refunded: "bg-gray-100 text-gray-800",
      Sent: "bg-blue-100 text-blue-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">Portfolio</h1>
        <p className="text-gray-600">
          Connected: {wallet.address?.slice(0, 10)}...{wallet.address?.slice(-8)}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="text-sm text-gray-500 mb-1">Total Bets</div>
            <div className="text-2xl font-bold text-black">{confirmedBets.length}</div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="text-sm text-gray-500 mb-1">Total Wagered</div>
            <div className="text-2xl font-bold text-black">
              {formatXrp(totalBetDrops.toString())}
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="text-sm text-gray-500 mb-1">Total Payouts</div>
            <div className="text-2xl font-bold text-green-600">
              {formatXrp(totalPayoutDrops.toString())}
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="text-sm text-gray-500 mb-1">Pending Bets</div>
            <div className="text-2xl font-bold text-yellow-600">{pendingBets.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="bets">
        <TabsList className="bg-gray-100 p-1 mb-6">
          <TabsTrigger value="bets" className="data-[state=active]:bg-white">
            My Bets ({bets.length})
          </TabsTrigger>
          <TabsTrigger value="payouts" className="data-[state=active]:bg-white">
            Payouts ({payouts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bets">
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : bets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">You haven't placed any bets yet</p>
              <Link href="/markets">
                <Button className="bg-black hover:bg-gray-800 text-white">
                  Browse Markets
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bets.map((bet) => (
                <Card key={bet.id} className="border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Link
                          href={`/markets/${bet.marketId}`}
                          className="font-semibold text-black hover:underline"
                        >
                          {bet.marketTitle || bet.marketId}
                        </Link>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge
                            className={
                              bet.outcome === "YES"
                                ? "bg-green-600 text-white"
                                : "bg-red-600 text-white"
                            }
                          >
                            {bet.outcome}
                          </Badge>
                          <span className="text-gray-500 text-sm">
                            {formatXrp(bet.amountDrops)}
                          </span>
                          <Badge className={statusBadge(bet.status)}>{bet.status}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        {bet.payout && (
                          <div className="text-green-600 font-semibold">
                            +{formatXrp(bet.payout)}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          {new Date(bet.placedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="payouts">
          {payouts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No payouts yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payouts.map((payout) => (
                <Card key={payout.id} className="border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Link
                          href={`/markets/${payout.marketId}`}
                          className="font-semibold text-black hover:underline"
                        >
                          {payout.marketTitle || payout.marketId}
                        </Link>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge className={statusBadge(payout.status)}>{payout.status}</Badge>
                          {payout.payoutTx && (
                            <a
                              href={`https://testnet.xrpl.org/transactions/${payout.payoutTx}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              View tx →
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-600 font-semibold text-xl">
                          +{formatXrp(payout.amountDrops)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(payout.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Disconnect Button */}
      <div className="mt-8 text-center">
        <Button variant="outline" onClick={wallet.disconnect} className="text-gray-500">
          Disconnect Wallet
        </Button>
      </div>
    </div>
  );
}
