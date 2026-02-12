"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { formatJPYC, mockBettors, type AdminMarket, type Bettor } from "@/lib/admin-data"

type PayoutRow = {
  name: string
  amount: number
  weight: number
  effectiveAmount: number
  payoutRatio: number
  payout: number
  multiplier: number
}

function computePayouts(market: AdminMarket, correctOutcomeId: string): {
  totalPool: number
  platformFee: number
  distributablePool: number
  correctTotal: number
  incorrectTotal: number
  rows: PayoutRow[]
} {
  const totalPool = market.totalVolume
  const platformFee = Math.floor(totalPool * 0.05)
  const distributablePool = totalPool - platformFee

  const bettors: Bettor[] = mockBettors[market.id] ?? []
  const winners = bettors.filter((b) => b.outcomeId === correctOutcomeId)
  const totalWinningEffective = winners.reduce((s, b) => s + b.effectiveAmount, 0)

  const correctTotal = winners.reduce((s, b) => s + b.amount, 0)
  const incorrectTotal = bettors.filter((b) => b.outcomeId !== correctOutcomeId).reduce((s, b) => s + b.amount, 0)

  const rows: PayoutRow[] = winners.map((b) => {
    const payoutRatio = totalWinningEffective > 0 ? b.effectiveAmount / totalWinningEffective : 0
    const payout = Math.floor(payoutRatio * distributablePool)
    const multiplier = b.amount > 0 ? payout / b.amount : 0
    return {
      name: b.name,
      amount: b.amount,
      weight: b.weight,
      effectiveAmount: b.effectiveAmount,
      payoutRatio,
      payout,
      multiplier,
    }
  })

  return { totalPool, platformFee, distributablePool, correctTotal, incorrectTotal, rows }
}

export function AdminResolvePanel({
  markets,
  preSelectedMarketId,
  onResolve,
}: {
  markets: AdminMarket[]
  preSelectedMarketId: string | null
  onResolve: (marketId: string, outcomeId: string) => void
}) {
  const closedMarkets = markets.filter((m) => m.status === "closed")
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(preSelectedMarketId)
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string | null>(null)
  const [confirmState, setConfirmState] = useState<"idle" | "confirming">("idle")
  const [resolved, setResolved] = useState(false)
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (preSelectedMarketId) {
      setSelectedMarketId(preSelectedMarketId)
      setSelectedOutcomeId(null)
      setConfirmState("idle")
      setResolved(false)
    }
  }, [preSelectedMarketId])

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current)
    }
  }, [])

  const market = closedMarkets.find((m) => m.id === selectedMarketId)
  const payoutData = market && selectedOutcomeId ? computePayouts(market, selectedOutcomeId) : null

  function handleMarketChange(id: string) {
    setSelectedMarketId(id || null)
    setSelectedOutcomeId(null)
    setConfirmState("idle")
    setResolved(false)
  }

  function handleConfirmClick() {
    if (confirmState === "idle") {
      setConfirmState("confirming")
      confirmTimerRef.current = setTimeout(() => {
        setConfirmState("idle")
      }, 3000)
    } else if (confirmState === "confirming" && market && selectedOutcomeId) {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current)
      onResolve(market.id, selectedOutcomeId)
      setResolved(true)
      setConfirmState("idle")
    }
  }

  if (closedMarkets.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        クローズ済みのマーケットがありません。先にマーケットをクローズしてください。
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Market Selector */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="resolve-market" className="text-sm font-medium text-foreground">
          マーケットを選択
        </label>
        <select
          id="resolve-market"
          value={selectedMarketId ?? ""}
          onChange={(e) => handleMarketChange(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-foreground"
        >
          <option value="">選択してください</option>
          {closedMarkets.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </select>
      </div>

      {market && (
        <div className={cn("flex flex-col gap-6", resolved && "relative")}>
          {/* Resolved overlay */}
          {resolved && (
            <div className="absolute inset-0 z-10 flex items-start justify-center rounded-lg border-2 border-[#16A34A]/30 bg-background/80 pt-20">
              <span className="text-lg font-bold text-[#16A34A]">{"✓ 確定済み"}</span>
            </div>
          )}

          {/* Success Banner */}
          {resolved && (
            <div className="rounded-md border border-[#16A34A]/30 bg-[#16A34A]/5 px-4 py-3 text-sm text-[#16A34A]">
              {"マーケット「"}{market.title}{"」の結果が確定されました"}
            </div>
          )}

          {/* Step 1: Select Outcome */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold text-foreground">正解の選択肢を選んでください</h4>
            <div className="flex flex-col gap-2">
              {market.outcomes.map((outcome) => (
                <button
                  key={outcome.id}
                  onClick={() => {
                    if (!resolved) {
                      setSelectedOutcomeId(outcome.id)
                      setConfirmState("idle")
                    }
                  }}
                  disabled={resolved}
                  className={cn(
                    "flex items-center justify-between rounded-md border px-4 py-3 text-left text-sm transition-all",
                    selectedOutcomeId === outcome.id
                      ? "border-l-4 border-foreground bg-muted"
                      : "border-border hover:bg-muted/50"
                  )}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-foreground">{outcome.label}</span>
                    <span className="text-xs text-muted-foreground">
                      ベット総額: <span className="font-mono">{formatJPYC(outcome.totalBets)}</span>
                    </span>
                  </div>
                  <span className="font-mono text-sm text-foreground">{outcome.probability}%</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Payout Simulation */}
          {payoutData && (
            <div className="flex flex-col gap-4">
              <div>
                <h4 className="text-sm font-bold text-foreground">配当シミュレーション</h4>
                <p className="mt-0.5 text-xs text-muted-foreground">結果確定前のプレビューです</p>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs text-muted-foreground">総プール金額</p>
                  <p className="mt-1 font-mono text-sm font-bold text-foreground">
                    {formatJPYC(payoutData.totalPool)}
                  </p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs text-muted-foreground">正解ベット総額</p>
                  <p className="mt-1 font-mono text-sm font-bold text-[#16A34A]">
                    {formatJPYC(payoutData.correctTotal)}
                  </p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs text-muted-foreground">不正解ベット総額</p>
                  <p className="mt-1 font-mono text-sm font-bold text-foreground">
                    {formatJPYC(payoutData.incorrectTotal)}
                  </p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs text-muted-foreground">手数料 (5%)</p>
                  <p className="mt-1 font-mono text-sm font-bold text-foreground">
                    {formatJPYC(payoutData.platformFee)}
                  </p>
                </div>
              </div>

              {/* Payout Breakdown Table */}
              {payoutData.rows.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium text-foreground">ベッター名</th>
                        <th className="px-3 py-2 text-right font-medium text-foreground">ベット額</th>
                        <th className="px-3 py-2 text-right font-medium text-foreground">重み</th>
                        <th className="px-3 py-2 text-right font-medium text-foreground">実効額</th>
                        <th className="px-3 py-2 text-right font-medium text-foreground">配当率</th>
                        <th className="px-3 py-2 text-right font-medium text-foreground">配当額</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payoutData.rows.map((row, i) => (
                        <tr key={i} className="border-b border-border last:border-b-0">
                          <td className="px-3 py-2 text-foreground">{row.name}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-right font-mono text-foreground">
                            {formatJPYC(row.amount)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                            {"×"}{row.weight.toFixed(1)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-right font-mono text-foreground">
                            {formatJPYC(row.effectiveAmount)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                            {(row.payoutRatio * 100).toFixed(1)}%
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-right font-mono font-bold text-foreground">
                            {formatJPYC(row.payout)}
                            <span className="ml-2 text-xs font-normal text-[#16A34A]">
                              {"×"}{row.multiplier.toFixed(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  この選択肢にベットしたユーザーはいません。
                </p>
              )}

              {/* Pool Distribution Bar */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-muted-foreground">プール分配</p>
                <div className="flex h-8 w-full overflow-hidden rounded-md">
                  <div
                    className="flex items-center justify-center bg-[#16A34A] text-xs font-medium text-background"
                    style={{ width: `${95}%` }}
                  >
                    勝者への配当 {formatJPYC(payoutData.distributablePool)} (95%)
                  </div>
                  <div
                    className="flex items-center justify-center bg-foreground text-xs font-medium text-background"
                    style={{ width: `${5}%` }}
                  >
                    5%
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>勝者への配当: 95%</span>
                  <span>手数料: 5%</span>
                </div>
              </div>

              {/* Step 3: Confirm */}
              {!resolved && (
                <button
                  onClick={handleConfirmClick}
                  className={cn(
                    "h-11 w-full rounded-md text-sm font-medium text-background transition-all",
                    confirmState === "confirming"
                      ? "bg-[#DC2626] animate-pulse"
                      : "bg-[#DC2626] hover:bg-[#DC2626]/90"
                  )}
                >
                  {confirmState === "idle" ? "結果を確定する" : "本当に確定しますか？"}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
