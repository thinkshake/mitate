import { markets } from "@/lib/markets-data"
import { MarketDetail } from "@/components/market-detail"
import { notFound } from "next/navigation"

export default async function MarketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const market = markets.find((m) => m.id === id)

  if (!market) {
    notFound()
  }

  return <MarketDetail market={market} />
}
