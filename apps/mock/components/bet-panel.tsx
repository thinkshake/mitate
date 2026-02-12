"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"

type Attribute = {
  type: string
  label: string
  weight: number
}

type Outcome = {
  id: string
  label: string
  probability: number
  totalBets: number
}

type BetPanelProps = {
  selectedOutcome: Outcome | null
  balance: number
  weightScore: number
  attributes: Attribute[]
  onPlaceBet: (amount: number) => void
  betConfirmed: boolean
}

const quickAmounts = [100, 500, 1000, 5000]

export function BetPanel({
  selectedOutcome,
  balance,
  weightScore,
  attributes,
  onPlaceBet,
  betConfirmed,
}: BetPanelProps) {
  const [amount, setAmount] = useState(0)
  const [inputValue, setInputValue] = useState("")

  const effectiveAmount = useMemo(
    () => Math.round(amount * weightScore),
    [amount, weightScore]
  )

  const isDisabled = !selectedOutcome || amount <= 0 || amount > balance
  const isInsufficientBalance = balance <= 0

  const handleAmountChange = (value: string) => {
    setInputValue(value)
    const parsed = parseInt(value, 10)
    setAmount(isNaN(parsed) ? 0 : parsed)
  }

  const handleQuickSelect = (value: number) => {
    setAmount(value)
    setInputValue(value.toString())
  }

  const handleSubmit = () => {
    if (isDisabled) return
    onPlaceBet(amount)
    setAmount(0)
    setInputValue("")
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      {/* Outcome Selection Display */}
      <div className="mb-5">
        <span className="text-xs text-muted-foreground">選択中</span>
        {selectedOutcome ? (
          <p className="mt-1 text-sm font-medium text-foreground">
            {selectedOutcome.label}
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">
            選択肢をクリックしてください
          </p>
        )}
      </div>

      <div className="border-t border-border pt-5">
        {/* Amount Input */}
        <label
          htmlFor="bet-amount"
          className="block text-xs font-medium text-foreground"
        >
          ベット金額 (JPYC)
        </label>
        <input
          id="bet-amount"
          type="number"
          min={0}
          max={balance}
          value={inputValue}
          onChange={(e) => handleAmountChange(e.target.value)}
          placeholder="0"
          className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 font-mono text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
        />

        {/* Quick select buttons */}
        <div className="mt-3 flex gap-2">
          {quickAmounts.map((q) => (
            <button
              key={q}
              onClick={() => handleQuickSelect(q)}
              disabled={q > balance}
              className={cn(
                "flex-1 rounded border px-2 py-1.5 font-mono text-xs transition-colors",
                amount === q
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-foreground hover:border-foreground disabled:cursor-not-allowed disabled:opacity-40"
              )}
            >
              {q.toLocaleString()}
            </button>
          ))}
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          利用可能:{" "}
          <span className="font-mono">
            ¥{balance.toLocaleString("ja-JP")} JPYC
          </span>
        </p>
      </div>

      {/* Weight Display */}
      <div className="mt-5 border-t border-border pt-5">
        <span className="text-xs font-medium text-foreground">
          あなたの重みスコア
        </span>
        <p className="mt-2 font-mono text-3xl font-bold text-foreground">
          {"×"}{weightScore.toFixed(1)}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {attributes.map((attr) => (
            <span
              key={attr.type}
              className="inline-flex items-center gap-1.5 rounded-full border border-foreground/20 bg-secondary px-2.5 py-1 text-xs text-foreground"
            >
              {attr.label}
              <span className="font-mono text-muted-foreground">
                {"×"}{attr.weight}
              </span>
            </span>
          ))}
        </div>

        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          属性がマーケットに関連する場合、予測の重みが増加します
        </p>
      </div>

      {/* Calculation Summary */}
      {amount > 0 && selectedOutcome && (
        <div className="mt-5 border-t border-border pt-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">ベット金額</span>
            <span className="font-mono text-foreground">
              ¥{amount.toLocaleString("ja-JP")} JPYC
            </span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">重みスコア</span>
            <span className="font-mono text-foreground">
              {"×"}{weightScore.toFixed(1)}
            </span>
          </div>
          <div className="my-3 border-t border-border" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              実効ベット額
            </span>
            <span className="font-mono text-base font-bold text-foreground">
              ¥{effectiveAmount.toLocaleString("ja-JP")} JPYC
            </span>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isDisabled || isInsufficientBalance}
        className={cn(
          "mt-5 h-11 w-full rounded-md font-medium text-sm transition-all",
          isDisabled || isInsufficientBalance
            ? "cursor-not-allowed bg-muted text-muted-foreground"
            : "bg-foreground text-background hover:opacity-90 active:scale-[0.98]"
        )}
      >
        {betConfirmed
          ? "予測が完了しました \u2713"
          : isInsufficientBalance
            ? "残高不足"
            : "予測する"}
      </button>
    </div>
  )
}
