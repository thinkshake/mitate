"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/contexts/WalletContext";
import { getBetsForUser, getPayoutsForUser, formatXrp, type Bet, type Payout } from "@/lib/api";

type Activity = {
  id: string;
  type: "bet" | "payout";
  marketId: string;
  marketTitle?: string;
  outcome: string;
  amountDrops: string;
  status: string;
  txHash?: string | null;
  timestamp: string;
};

export default function ActivityPage() {
  const wallet = useWallet();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!wallet.connected || !wallet.address) return;

    setLoading(true);
    setError(null);

    Promise.all([
      getBetsForUser(wallet.address),
      getPayoutsForUser(wallet.address),
    ])
      .then(([bets, payouts]) => {
        // Combine bets and payouts into activities
        const betActivities: Activity[] = bets.map((b) => ({
          id: b.id,
          type: "bet" as const,
          marketId: b.marketId,
          marketTitle: b.marketTitle,
          outcome: b.outcome,
          amountDrops: b.amountDrops,
          status: b.status,
          txHash: b.paymentTx,
          timestamp: b.placedAt,
        }));

        const payoutActivities: Activity[] = payouts.map((p) => ({
          id: p.id,
          type: "payout" as const,
          marketId: p.marketId,
          marketTitle: p.marketTitle,
          outcome: "WIN",
          amountDrops: p.amountDrops,
          status: p.status,
          txHash: p.payoutTx,
          timestamp: p.createdAt,
        }));

        // Sort by timestamp (newest first)
        const combined = [...betActivities, ...payoutActivities].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        setActivities(combined);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load activity");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [wallet.connected, wallet.address]);

  if (!wallet.connected) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-black mb-4">Connect Your Wallet</h1>
          <p className="text-gray-600 mb-8">
            Connect your GemWallet to view your activity history.
          </p>
          {!wallet.gemWalletInstalled ? (
            <a href="https://gemwallet.app" target="_blank" rel="noopener noreferrer">
              <Button className="w-full bg-black hover:bg-gray-800 text-white" size="lg">
                Install GemWallet
              </Button>
            </a>
          ) : (
            <Button
              onClick={wallet.connect}
              disabled={wallet.loading}
              className="w-full bg-black hover:bg-gray-800 text-white"
              size="lg"
            >
              {wallet.loading ? "Connecting..." : "Connect GemWallet"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">Activity</h1>
        <p className="text-gray-600">Your betting history and payouts</p>
      </div>

      {/* Activity List */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg text-black">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded"></div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">No activity yet</p>
              <Link href="/markets">
                <Button className="bg-black hover:bg-gray-800 text-white">
                  Place Your First Bet
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="py-4 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        ${
                          activity.type === "bet"
                            ? activity.outcome === "YES"
                              ? "bg-green-100"
                              : "bg-red-100"
                            : "bg-blue-100"
                        }
                      `}
                    >
                      {activity.type === "bet" ? (
                        <svg
                          className={`w-5 h-5 ${
                            activity.outcome === "YES" ? "text-green-600" : "text-red-600"
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <div>
                      <Link
                        href={`/markets/${activity.marketId}`}
                        className="font-medium text-black line-clamp-1 hover:underline"
                      >
                        {activity.marketTitle || activity.marketId}
                      </Link>
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        {activity.type === "bet" ? (
                          <>
                            Bet on{" "}
                            <Badge
                              className={
                                activity.outcome === "YES"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {activity.outcome}
                            </Badge>
                          </>
                        ) : (
                          <>Payout received</>
                        )}
                        <Badge
                          className={
                            activity.status === "Confirmed" || activity.status === "Sent"
                              ? "bg-green-100 text-green-800"
                              : activity.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {activity.status}
                        </Badge>
                      </div>
                      {activity.txHash && (
                        <a
                          href={`https://testnet.xrpl.org/transactions/${activity.txHash}`}
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
                    <div
                      className={`font-medium ${
                        activity.type === "payout" ? "text-green-600" : "text-black"
                      }`}
                    >
                      {activity.type === "payout" ? "+" : "-"}
                      {formatXrp(activity.amountDrops)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
