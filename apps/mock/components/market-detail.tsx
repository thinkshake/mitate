"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { type Market } from "@/lib/markets-data"
import { MarketDetailHeader } from "@/components/market-detail-header"
import { OutcomesList } from "@/components/outcomes-list"
import { BetPanel } from "@/components/bet-panel"
import { MarketInfoBox } from "@/components/market-info-box"
import { PositionBox } from "@/components/position-box"

type Outcome = {
  id: string
  label: string
  probability: number
  totalBets: number
}

type Position = {
  outcomeLabel: string
  amount: number
  weight: number
  effectiveAmount: number
}

const initialOutcomesFromMarket = (market: Market): Outcome[] => {
  const totalVolume = market.totalVolume
  return market.outcomes.map((o) => ({
    ...o,
    totalBets: Math.round((o.probability / 100) * totalVolume),
  }))
}

const currentUser = {
  displayName: "田中太郎",
  balance: 12500,
  weightScore: 1.8,
  attributes: [
    { type: "region", label: "宮城県在住", weight: 1.5 },
    { type: "expertise", label: "政治学専攻", weight: 1.2 },
  ],
}

export function MarketDetail({ market }: { market: Market }) {
  const [outcomes, setOutcomes] = useState<Outcome[]>(() =>
    initialOutcomesFromMarket(market)
  )
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string | null>(null)
  const [balance, setBalance] = useState(currentUser.balance)
  const [totalVolume, setTotalVolume] = useState(market.totalVolume)
  const [participants, setParticipants] = useState(342)
  const [positions, setPositions] = useState<Position[]>([])
  const [betConfirmed, setBetConfirmed] = useState(false)

  const selectedOutcome = outcomes.find((o) => o.id === selectedOutcomeId) ?? null

  const handlePlaceBet = useCallback(
    (amount: number) => {
      if (!selectedOutcomeId) return

      const effectiveAmount = Math.round(amount * currentUser.weightScore)

      // Update outcomes with LSMR-lite logic
      setOutcomes((prev) => {
        const updated = prev.map((o) =>
          o.id === selectedOutcomeId
            ? { ...o, totalBets: o.totalBets + effectiveAmount }
            : o
        )

        const grandTotal = updated.reduce((sum, o) => sum + o.totalBets, 0)
        const rawProbs = updated.map((o) => ({
          ...o,
          probability: (o.totalBets / grandTotal) * 100,
        }))

        // Round and ensure sum = 100
        const rounded = rawProbs.map((o) => ({
          ...o,
          probability: Math.round(o.probability),
        }))
        const diff = 100 - rounded.reduce((sum, o) => sum + o.probability, 0)
        if (diff !== 0) {
          const largest = rounded.reduce((max, o) =>
            o.totalBets > max.totalBets ? o : max
          )
          largest.probability += diff
        }

        return rounded
      })

      // Update balance and volume
      setBalance((prev) => prev - amount)
      setTotalVolume((prev) => prev + effectiveAmount)
      setParticipants((prev) => prev + 1)

      // Record position
      const outcomeLabel =
        outcomes.find((o) => o.id === selectedOutcomeId)?.label ?? ""
      setPositions((prev) => [
        ...prev,
        {
          outcomeLabel,
          amount,
          weight: currentUser.weightScore,
          effectiveAmount,
        },
      ])

      // Show confirmation
      setBetConfirmed(true)
      setTimeout(() => setBetConfirmed(false), 2500)
    },
    [selectedOutcomeId, outcomes]
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketDetailHeader balance={balance} />

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-6 lg:px-6">
        {/* Back link */}
        <Link
          href="/"
          className="inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {"← マーケット一覧"}
        </Link>

        <div className="mt-6 flex flex-col gap-8 lg:flex-row">
          {/* Left Column */}
          <div className="min-w-0 flex-1 lg:max-w-[60%]">
            {/* Market Header */}
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                {market.categoryLabel}
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs text-emerald-700">
                オープン
              </span>
            </div>

            <h1 className="mt-4 text-balance text-2xl font-bold leading-relaxed text-foreground lg:text-3xl">
              {market.title}
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {market.description}
            </p>

            {/* Outcomes Section */}
            <OutcomesList
              outcomes={outcomes}
              selectedOutcomeId={selectedOutcomeId}
              onSelect={setSelectedOutcomeId}
            />

            {/* Probability Trend */}
            <div className="mt-8 border-t border-border pt-6">
              <h3 className="text-sm font-medium text-foreground">確率トレンド</h3>
              <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                <span>{outcomes[0]?.label}:</span>
                <span className="font-mono text-muted-foreground">
                  24h前: 38%
                </span>
                <span className="text-muted-foreground">{"→"}</span>
                <span className="font-mono font-medium text-foreground">
                  現在: {outcomes[0]?.probability}%
                </span>
              </div>
            </div>
          </div>

          {/* Right Column (Sidebar) */}
          <div className="flex w-full shrink-0 flex-col gap-6 lg:w-[38%]">
            <BetPanel
              selectedOutcome={selectedOutcome}
              balance={balance}
              weightScore={currentUser.weightScore}
              attributes={currentUser.attributes}
              onPlaceBet={handlePlaceBet}
              betConfirmed={betConfirmed}
            />

            <MarketInfoBox
              totalVolume={totalVolume}
              participants={participants}
              createdAt="2026-01-15"
              endDate={market.endDate}
            />

            {positions.length > 0 && <PositionBox positions={positions} />}
          </div>
        </div>
      </main>
    </div>
  )
}
