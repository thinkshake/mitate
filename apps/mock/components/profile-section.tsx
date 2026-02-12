"use client"

import { cn } from "@/lib/utils"
import { truncateAddress } from "@/lib/user-data"

type ProfileSectionProps = {
  displayName: string
  walletAddress: string
  balance: number
  weightScore: number
  onCharge: () => void
  chargeFlash: boolean
}

export function ProfileSection({
  displayName,
  walletAddress,
  balance,
  weightScore,
  onCharge,
  chargeFlash,
}: ProfileSectionProps) {
  return (
    <section aria-label="プロフィール">
      <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
      <p className="mt-1 font-mono text-sm text-muted-foreground">
        {truncateAddress(walletAddress)}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border p-5">
          <p className="text-xs text-muted-foreground">JPYC 残高</p>
          <p
            className={cn(
              "mt-2 font-mono text-2xl font-bold text-foreground transition-colors duration-500",
              chargeFlash && "text-emerald-600"
            )}
          >
            ¥{balance.toLocaleString("ja-JP")}
          </p>
        </div>
        <div className="rounded-lg border border-border p-5">
          <p className="text-xs text-muted-foreground">総合重みスコア</p>
          <p className="mt-2 font-mono text-2xl font-bold text-foreground">
            {"\u00D7"}{weightScore.toFixed(1)}
          </p>
        </div>
      </div>

      <button
        onClick={onCharge}
        className="mt-4 rounded border border-foreground bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80"
      >
        チャージ
      </button>
    </section>
  )
}
