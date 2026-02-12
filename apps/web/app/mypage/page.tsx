"use client"

import Link from "next/link"
import { useWallet } from "@/contexts/WalletContext"
import { useUser } from "@/contexts/UserContext"
import { formatXrp } from "@/lib/api"

export default function MyPage() {
  const wallet = useWallet()
  const user = useUser()

  if (!wallet.connected) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center lg:px-6">
        <h1 className="text-xl font-bold text-foreground">マイページ</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          ウォレットを接続してポートフォリオを確認しましょう
        </p>
        <button
          onClick={wallet.connect}
          disabled={wallet.loading}
          className="mt-6 rounded-md bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
        >
          {wallet.loading ? "接続中..." : "ウォレット接続"}
        </button>
      </div>
    )
  }

  const bets = user.bets
  const totalBetDrops = bets.reduce(
    (sum, b) => sum + BigInt(b.amountDrops),
    BigInt(0),
  )

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-6 lg:px-6">
      {/* Profile Section */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">ウォレットアドレス</p>
            <p className="mt-1 font-mono text-sm text-foreground">
              {wallet.address?.slice(0, 8)}...{wallet.address?.slice(-6)}
            </p>
          </div>
          <button
            onClick={wallet.disconnect}
            className="rounded border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            切断
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-md border border-border p-3">
            <p className="text-xs text-muted-foreground">残高</p>
            <p className="mt-1 font-mono text-lg font-bold text-foreground">
              {wallet.balance ? formatXrp(wallet.balance) : "—"}
            </p>
          </div>
          <div className="rounded-md border border-border p-3">
            <p className="text-xs text-muted-foreground">重みスコア</p>
            <p className="mt-1 font-mono text-lg font-bold text-foreground">
              ×{user.weightScore.toFixed(1)}
            </p>
          </div>
          <div className="rounded-md border border-border p-3">
            <p className="text-xs text-muted-foreground">ベット数</p>
            <p className="mt-1 font-mono text-lg font-bold text-foreground">
              {bets.length}
            </p>
          </div>
          <div className="rounded-md border border-border p-3">
            <p className="text-xs text-muted-foreground">総賭け金</p>
            <p className="mt-1 font-mono text-lg font-bold text-foreground">
              {formatXrp(totalBetDrops.toString())}
            </p>
          </div>
        </div>
      </div>

      {/* Attributes */}
      {user.attributes.length > 0 && (
        <div className="mt-6 rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-medium text-foreground">属性</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {user.attributes.map((attr) => (
              <span
                key={attr.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-foreground/20 bg-secondary px-3 py-1.5 text-xs text-foreground"
              >
                <span className="text-muted-foreground">{attr.typeLabel}</span>
                {attr.label}
                <span className="font-mono text-muted-foreground">×{attr.weight}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Active Bets */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-foreground">ベット履歴</h3>
        {user.loading ? (
          <div className="mt-3 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-muted" />
            ))}
          </div>
        ) : bets.length === 0 ? (
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">まだベットがありません</p>
            <Link
              href="/"
              className="mt-3 inline-block text-sm text-foreground underline underline-offset-4 transition-colors hover:text-muted-foreground"
            >
              マーケットを探す
            </Link>
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {bets.map((bet) => (
              <Link
                key={bet.id}
                href={`/market/${bet.marketId}`}
                className="rounded-lg border border-border bg-card p-4 transition-all hover:border-foreground/20"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {bet.marketTitle || bet.marketId}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="rounded bg-secondary px-2 py-0.5 text-xs text-foreground">
                        {bet.outcomeLabel}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {formatXrp(bet.amountDrops)}
                      </span>
                      {bet.weightScore > 1 && (
                        <span className="font-mono text-xs text-muted-foreground">
                          ×{bet.weightScore.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm font-semibold text-foreground">
                      {bet.currentProbability}%
                    </span>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(bet.createdAt).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
