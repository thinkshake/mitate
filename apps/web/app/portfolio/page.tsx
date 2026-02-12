"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWallet } from "@/contexts/WalletContext";
import { useUser } from "@/contexts/UserContext";
import { formatXrp } from "@/lib/api";

export default function PortfolioPage() {
  const wallet = useWallet();
  const user = useUser();

  if (!wallet.connected) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-4">ウォレットを接続</h1>
          <p className="text-muted-foreground mb-8">
            GemWalletを接続して、ポートフォリオ、ベット、配当を確認しましょう。
          </p>
          {!wallet.gemWalletInstalled ? (
            <a
              href="https://gemwallet.app"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="w-full" size="lg">
                GemWalletをインストール
              </Button>
            </a>
          ) : (
            <Button
              onClick={wallet.connect}
              disabled={wallet.loading}
              className="w-full"
              size="lg"
            >
              {wallet.loading ? "接続中..." : "GemWalletを接続"}
            </Button>
          )}
          {wallet.error && (
            <p className="mt-4 text-destructive text-sm">{wallet.error}</p>
          )}
        </div>
      </div>
    );
  }

  const bets = user.bets;
  const totalBetDrops = bets.reduce(
    (sum, b) => sum + BigInt(b.amountDrops),
    BigInt(0),
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">マイページ</h1>
        <p className="text-muted-foreground">
          接続中: {wallet.address?.slice(0, 10)}...{wallet.address?.slice(-8)}
          <span className="ml-2 text-xs">({wallet.network})</span>
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-1">残高</div>
            <div className="text-2xl font-bold">
              {wallet.balance ? formatXrp(wallet.balance) : "—"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-1">ベット数</div>
            <div className="text-2xl font-bold">{bets.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-1">総賭け金</div>
            <div className="text-2xl font-bold">
              {formatXrp(totalBetDrops.toString())}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-1">
              重みスコア
            </div>
            <div className="text-2xl font-bold">{user.weightScore.toFixed(1)}x</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="bets">
        <TabsList className="mb-6">
          <TabsTrigger value="bets">ベット ({bets.length})</TabsTrigger>
          <TabsTrigger value="attributes">
            属性 ({user.attributes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bets">
          {user.loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted rounded"></div>
              ))}
            </div>
          ) : bets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                まだベットがありません
              </p>
              <Link href="/markets">
                <Button>マーケットを探す</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bets.map((bet) => (
                <Card key={bet.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Link
                          href={`/markets/${bet.marketId}`}
                          className="font-semibold hover:underline"
                        >
                          {bet.marketTitle || bet.marketId}
                        </Link>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant="secondary">{bet.outcomeLabel}</Badge>
                          <span className="text-muted-foreground text-sm">
                            {formatXrp(bet.amountDrops)}
                          </span>
                          {bet.weightScore > 1 && (
                            <Badge variant="outline">
                              ×{bet.weightScore.toFixed(1)}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          {bet.currentProbability}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(bet.createdAt).toLocaleDateString("ja-JP")}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="attributes">
          {user.attributes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                登録された属性はありません
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {user.attributes.map((attr) => (
                <Card key={attr.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{attr.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {attr.typeLabel}
                        </div>
                      </div>
                      <Badge variant="outline">×{attr.weight.toFixed(1)}</Badge>
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
        <Button variant="outline" onClick={wallet.disconnect}>
          ウォレットを切断
        </Button>
      </div>
    </div>
  );
}
