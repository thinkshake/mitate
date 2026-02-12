"use client"

import { cn } from "@/lib/utils"

const categories = [
  { value: "all", label: "すべて" },
  { value: "politics", label: "政治" },
  { value: "economy", label: "経済" },
  { value: "local", label: "地域" },
  { value: "culture", label: "文化" },
  { value: "tech", label: "テック" },
]

const statuses = [
  { value: "all", label: "すべて" },
  { value: "open", label: "オープン" },
  { value: "closed", label: "クローズ" },
  { value: "resolved", label: "解決済み" },
]

type FilterBarProps = {
  activeCategory: string
  activeStatus: string
  onCategoryChange: (category: string) => void
  onStatusChange: (status: string) => void
}

export function FilterBar({
  activeCategory,
  activeStatus,
  onCategoryChange,
  onStatusChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2" role="group" aria-label="カテゴリフィルター">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => onCategoryChange(cat.value)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm transition-colors",
              activeCategory === cat.value
                ? "border-foreground bg-foreground text-background"
                : "border-border text-foreground hover:border-foreground"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="ステータスフィルター">
        {statuses.map((s) => (
          <button
            key={s.value}
            onClick={() => onStatusChange(s.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs transition-colors",
              activeStatus === s.value
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
