import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Market, formatVolume, formatPrice } from "@/lib/mock-data";

interface MarketCardProps {
  market: Market;
  featured?: boolean;
}

export function MarketCard({ market, featured = false }: MarketCardProps) {
  return (
    <Link href={`/markets/${market.id}`}>
      <Card className={`
        border border-gray-200 hover:border-gray-300 transition-all duration-200 
        hover:shadow-sm cursor-pointer bg-white
        ${featured ? "h-full" : ""}
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
              Expires {market.expiresAt}
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
              <span className="text-gray-600">Yes</span>
              <span className="font-medium text-black">{formatPrice(market.yesPrice)}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-black rounded-full transition-all duration-300"
                style={{ width: `${market.yesPrice}%` }}
              />
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Vol: <span className="text-gray-700">{formatVolume(market.volume)}</span>
            </div>
            <div className="flex space-x-2">
              <div className="bg-black text-white text-xs px-3 h-8 rounded-md flex items-center font-medium">
                Yes {formatPrice(market.yesPrice)}
              </div>
              <div className="border border-gray-300 text-gray-700 text-xs px-3 h-8 rounded-md flex items-center font-medium">
                No {formatPrice(market.noPrice)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
