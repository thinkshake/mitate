"use client"

import { cn } from "@/lib/utils"
import { formatJPYC, type AdminMarket } from "@/lib/admin-data"

function StatusBadge({ status }: { status: AdminMarket["status"] }) {
  const config = {
    open: { label: "オープン", className: "bg-foreground text-background" },
    closed: { label: "クローズ", className: "bg-muted text-muted-foreground" },
    resolved: { label: "確定済み", className: "bg-[#16A34A]/10 text-[#16A34A]" },
  }
  const { label, className } = config[status]
  return (
    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", className)}>
      {label}
    </span>
  )
}

export function AdminMarketsTable({
  markets,
  onCloseMarket,
  onGoToResolve,
}: {
  markets: AdminMarket[]
  onCloseMarket: (id: string) => void
  onGoToResolve: (id: string) => void
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left font-medium text-foreground">タイトル</th>
            <th className="px-4 py-3 text-left font-medium text-foreground">カテゴリ</th>
            <th className="px-4 py-3 text-left font-medium text-foreground">ステータス</th>
            <th className="px-4 py-3 text-right font-medium text-foreground">総取引量</th>
            <th className="px-4 py-3 text-left font-medium text-foreground">終了日</th>
            <th className="px-4 py-3 text-right font-medium text-foreground">アクション</th>
          </tr>
        </thead>
        <tbody>
          {markets.map((market) => (
            <tr key={market.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
              <td className="max-w-[240px] truncate px-4 py-3 font-medium text-foreground">
                {market.title}
              </td>
              <td className="px-4 py-3">
                <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                  {market.categoryLabel}
                </span>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={market.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-foreground">
                {formatJPYC(market.totalVolume)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-muted-foreground">
                {market.endDate}
              </td>
              <td className="px-4 py-3 text-right">
                {market.status === "open" && (
                  <button
                    onClick={() => onCloseMarket(market.id)}
                    className="rounded border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                  >
                    クローズ
                  </button>
                )}
                {market.status === "closed" && (
                  <button
                    onClick={() => onGoToResolve(market.id)}
                    className="text-xs font-medium text-foreground underline underline-offset-4 transition-colors hover:text-muted-foreground"
                  >
                    {"結果確定へ →"}
                  </button>
                )}
                {market.status === "resolved" && (
                  <span className="text-xs text-[#16A34A]">確定済み</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
