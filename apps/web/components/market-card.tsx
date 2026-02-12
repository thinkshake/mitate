import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MarketCardProps {
  market: {
    id: string;
    title: string;
    category: string;
    yesPrice: number;
    noPrice: number;
    volume: number;
    expiresAt: string;
    status?: string;
  };
  featured?: boolean;
}

function formatVolume(drops: number): string {
  const xrp = drops / 1_000_000;
  if (xrp >= 1000) {
    return `${(xrp / 1000).toFixed(1)}K XRP`;
  }
  if (xrp >= 1) {
    return `${xrp.toFixed(0)} XRP`;
  }
  return `${xrp.toFixed(2)} XRP`;
}

export function MarketCard({ market, featured = false }: MarketCardProps) {
  const isOpen = market.status === "Open" || !market.status;
  
  return (
    <Link href={`/markets/${market.id}`}>
      <Card className={`
        border border-gray-200 hover:border-gray-300 transition-all duration-200 
        hover:shadow-sm cursor-pointer bg-white
        ${featured ? "h-full" : ""}
        ${!isOpen ? "opacity-75" : ""}
      `}>
        <CardContent className="p-5">
          {/* Category Badge */}
          <div className="flex items-center justify-between mb-3">
            <Badge
              variant="secondary"
              className="bg-gray-100 text-gray-600 hover:bg-gray-100 font-medium"
            >
              {market.category.charAt(0).toUpperCase() + market.category.slice(1)}
            </Badge>
            <span className="text-xs text-gray-500">
              {market.expiresAt}
            </span>
          </div>

          {/* Title */}
          <h3 className={`
            font-semibold text-black mb-4 line-clamp-2
            ${featured ? "text-lg" : "text-base"}
          `}>
            {market.title}
          </h3>

          {/* Price Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-green-600">Yes {market.yesPrice}%</span>
              <span className="text-red-600">No {market.noPrice}%</span>
            </div>
            <div className="h-2 bg-red-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-300"
                style={{ width: `${market.yesPrice}%` }}
              />
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Pool: <span className="text-gray-700">{formatVolume(market.volume)}</span>
            </div>
            {market.status && market.status !== "Open" && (
              <Badge
                className={
                  market.status === "Resolved"
                    ? "bg-blue-100 text-blue-800"
                    : market.status === "Closed"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
                }
              >
                {market.status}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
