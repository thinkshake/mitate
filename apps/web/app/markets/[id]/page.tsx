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
  formatDeadline,
  xrpToDrops,
  type Bet,
  type Outcome,
} from "@/lib/api";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MarketDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { market, loading, error, refetch } = useMarket(id);
  const wallet = useWallet();

  const [selectedOutcome, setSelectedOutcome] = useState<Outcome | null>(null);
  const [xrpAmount, setXrpAmount] = useState("10");
  const [betLoading, setBetLoading] = useState(false);
  const [betError, setBetError] = useState<string | null>(null);
  const [betSuccess, setBetSuccess] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    potentialPayout: string;
    impliedOdds: string;
  } | null>(null);
  const [recentBets, setRecentBets] = useState<Bet[]>([]);

  // Auto-select first outcome
  useEffect(() => {
    if (market?.outcomes?.length && !selectedOutcome) {
      setSelectedOutcome(market.outcomes[0]);
    }
  }, [market, selectedOutcome]);

  // Fetch bet preview
  useEffect(() => {
    if (!id || !xrpAmount || !selectedOutcome || parseFloat(xrpAmount) <= 0) {
      setPreview(null);
      return;
    }

    const fetchPreview = async () => {
      try {
        const amountDrops = xrpToDrops(parseFloat(xrpAmount));
        const data = await previewBet(
          id,
          selectedOutcome.id,
          amountDrops,
          wallet.address || undefined,
        );
        setPreview({
          potentialPayout: data.potentialPayout,
          impliedOdds: data.impliedOdds,
        });
      } catch {
        setPreview(null);
      }
    };

    const debounce = setTimeout(fetchPreview, 300);
    return () => clearTimeout(debounce);
  }, [id, xrpAmount, selectedOutcome, wallet.address]);

  // Fetch recent bets
  useEffect(() => {
    if (!id) return;
    getBetsForMarket(id)
      .then((data) => setRecentBets(data.bets.slice(0, 5)))
      .catch(() => setRecentBets([]));
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-4"></div>
          <div className="h-64 bg-muted rounded mb-4"></div>
        </div>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">
          {error || "マーケットが見つかりません"}
        </h1>
        <Link href="/markets">
          <Button>マーケット一覧に戻る</Button>
        </Link>
      </div>
    );
  }

  const handlePlaceBet = async () => {
    if (!wallet.connected || !wallet.address) {
      wallet.connect();
      return;
    }
    if (!selectedOutcome) return;

    setBetLoading(true);
    setBetError(null);
    setBetSuccess(null);

    try {
      const amountDrops = xrpToDrops(parseFloat(xrpAmount));
      const result = await placeBet(
        id,
        selectedOutcome.id,
        amountDrops,
        wallet.address,
      );

      // Sign and submit transaction
      if (result.unsignedTx) {
        const txResult = await wallet.signAndSubmitTransaction(
          result.unsignedTx,
        );
        if (!txResult?.hash) {
          throw new Error("トランザクションが拒否されました");
        }
        await confirmBet(id, result.bet.id, txResult.hash);
      }

      setBetSuccess("ベットが完了しました！");
      refetch();
      getBetsForMarket(id)
        .then((data) => setRecentBets(data.bets.slice(0, 5)))
        .catch(() => {});
    } catch (err) {
      setBetError(
        err instanceof Error ? err.message : "ベットに失敗しました",
      );
    } finally {
      setBetLoading(false);
    }
  };

  const statusLabel: Record<string, string> = {
    pending: "準備中",
    open: "オープン",
    closed: "クローズ",
    resolved: "解決済み",
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">
          ホーム
        </Link>
        <span className="mx-2">/</span>
        <Link href="/markets" className="hover:text-foreground">
          マーケット
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">
          {market.categoryLabel || market.category}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Market Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <Badge variant="secondary">
                {market.categoryLabel || market.category}
              </Badge>
              <Badge>{statusLabel[market.status] || market.status}</Badge>
              <span className="text-sm text-muted-foreground">
                {formatDeadline(market.bettingDeadline)}
              </span>
            </div>
            <h1 className="text-3xl font-bold mb-4">{market.title}</h1>
            <p className="text-muted-foreground">{market.description}</p>
          </div>

          {/* Outcomes Display */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">予測結果</h3>
              <div className="space-y-3">
                {market.outcomes.map((outcome) => (
                  <div key={outcome.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{outcome.label}</span>
                      <span className="font-semibold">{outcome.probability}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${outcome.probability}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatXrp(outcome.totalAmountDrops)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                総プール: {formatXrp(market.totalPoolDrops)}
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="about" className="mb-8">
            <TabsList>
              <TabsTrigger value="about">概要</TabsTrigger>
              <TabsTrigger value="bets">最近のベット</TabsTrigger>
              <TabsTrigger value="xrpl">XRPL詳細</TabsTrigger>
            </TabsList>
            <TabsContent value="about" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-3">説明</h3>
                  <p className="text-muted-foreground mb-4">
                    {market.description}
                  </p>
                  <h3 className="font-semibold mb-3">パリミュチュエルルール</h3>
                  <ul className="text-muted-foreground space-y-2 text-sm">
                    <li>
                      • 勝利した結果への全ベットがプール全体を按分
                    </li>
                    <li>
                      • 配当 = (あなたのベット / 勝利ベット合計) × 総プール
                    </li>
                    <li>• 結果確定にはマルチサイン承認が必要</li>
                    <li>• 属性による重みスコアがベットに適用</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="bets" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-3">最近のベット</h3>
                  {recentBets.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      まだベットがありません
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {recentBets.map((bet) => (
                        <div
                          key={bet.id}
                          className="flex items-center justify-between py-2 border-b border-border last:border-0"
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {bet.outcomeLabel}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {bet.bettorAddress?.slice(0, 8)}...
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
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-3">オンチェーン詳細</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        マーケットID
                      </span>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {market.id}
                      </code>
                    </div>
                    {market.escrowTxHash && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          エスクローTx
                        </span>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {market.escrowTxHash.slice(0, 12)}...
                        </code>
                      </div>
                    )}
                    {market.escrowSequence && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          エスクローSeq
                        </span>
                        <span>{market.escrowSequence}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Trading Panel */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">予測する</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {market.status !== "open" ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-2">
                    このマーケットは{statusLabel[market.status] || market.status}
                    です
                  </p>
                  {market.resolvedOutcomeId && (
                    <p className="text-lg font-semibold text-foreground">
                      結果:{" "}
                      {market.outcomes.find(
                        (o) => o.id === market.resolvedOutcomeId,
                      )?.label || market.resolvedOutcomeId}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {/* Outcome Selection */}
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">
                      結果を選択
                    </label>
                    {market.outcomes.map((outcome) => (
                      <Button
                        key={outcome.id}
                        variant={
                          selectedOutcome?.id === outcome.id
                            ? "default"
                            : "outline"
                        }
                        className="w-full justify-between"
                        onClick={() => setSelectedOutcome(outcome)}
                      >
                        <span>{outcome.label}</span>
                        <span>{outcome.probability}%</span>
                      </Button>
                    ))}
                  </div>

                  <Separator />

                  {/* Amount */}
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      ベット金額 (XRP)
                    </label>
                    <Input
                      type="number"
                      value={xrpAmount}
                      onChange={(e) => setXrpAmount(e.target.value)}
                      min={1}
                      step={1}
                    />
                    <div className="flex gap-2 mt-2">
                      {[1, 5, 10, 50].map((amt) => (
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

                  <Separator />

                  {/* Summary */}
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ベット</span>
                      <span className="font-medium">
                        {xrpAmount} XRP →{" "}
                        {selectedOutcome?.label || "未選択"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">確率</span>
                      <span className="font-medium">
                        {selectedOutcome?.probability ?? "—"}%
                      </span>
                    </div>
                    {preview && (
                      <div className="flex justify-between pt-2 border-t">
                        <span className="font-medium">予想配当</span>
                        <span className="text-green-600 font-semibold">
                          {formatXrp(preview.potentialPayout)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Errors/Success */}
                  {betError && (
                    <div className="p-3 bg-destructive/10 text-destructive text-sm rounded">
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
                    className="w-full"
                    size="lg"
                    onClick={handlePlaceBet}
                    disabled={
                      betLoading ||
                      !selectedOutcome ||
                      parseFloat(xrpAmount) <= 0
                    }
                  >
                    {betLoading
                      ? "処理中..."
                      : wallet.connected
                      ? `${xrpAmount} XRPで予測する`
                      : "GemWalletを接続"}
                  </Button>

                  {/* Wallet Status */}
                  {wallet.connected && (
                    <p className="text-xs text-muted-foreground text-center">
                      接続中: {wallet.address?.slice(0, 8)}...
                      {wallet.address?.slice(-6)}
                      {wallet.balance && (
                        <span className="ml-2">
                          ({formatXrp(wallet.balance)})
                        </span>
                      )}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground text-center">
                    ベットは取消不可です。結果確定後に配当が分配されます。
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
