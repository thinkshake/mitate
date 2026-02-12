"use client"

import { HeroSection } from "@/components/hero-section"
import { MarketsGrid } from "@/components/markets-grid"

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 lg:px-6">
      <HeroSection />
      <MarketsGrid />
    </div>
  )
}
