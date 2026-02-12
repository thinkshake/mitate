"use client"

import { useState } from "react"
import { markets } from "@/lib/markets-data"
import { FilterBar } from "@/components/filter-bar"
import { MarketCard } from "@/components/market-card"

export function MarketsGrid() {
  const [activeCategory, setActiveCategory] = useState("all")
  const [activeStatus, setActiveStatus] = useState("all")

  const filtered = markets.filter((m) => {
    const matchCategory = activeCategory === "all" || m.category === activeCategory
    const matchStatus = activeStatus === "all" || m.status === activeStatus
    return matchCategory && matchStatus
  })

  return (
    <section>
      <FilterBar
        activeCategory={activeCategory}
        activeStatus={activeStatus}
        onCategoryChange={setActiveCategory}
        onStatusChange={setActiveStatus}
      />

      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-muted-foreground">該当するマーケットがありません</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      )}
    </section>
  )
}
