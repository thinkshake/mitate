import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type Market, formatXrpCompact, formatDeadline } from "@/lib/api";

interface MarketCardProps {
  market: Market;
  featured?: boolean;
}

export function MarketCard({ market, featured = false }: MarketCardProps) {
  const isOpen = market.status === "open";
  const topOutcome = market.outcomes?.[0];
  const topProbability = topOutcome?.probability ?? 50;

  return (
    <Link href={`/markets/${market.id}`}>
      <Card
        className={`
        border border-border hover:border-muted-foreground/30 transition-all duration-200
        hover:shadow-sm cursor-pointer
        ${featured ? "h-full" : ""}
        ${!isOpen ? "opacity-75" : ""}
      `}
      >
        <CardContent className="p-5">
          {/* Category Badge */}
          <div className="flex items-center justify-between mb-3">
            <Badge
              variant="secondary"
              className="font-medium"
            >
              {market.categoryLabel || market.category}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDeadline(market.bettingDeadline)}
            </span>
          </div>

          {/* Title */}
          <h3
            className={`
            font-semibold mb-4 line-clamp-2
            ${featured ? "text-lg" : "text-base"}
          `}
          >
            {market.title}
          </h3>

          {/* Outcomes */}
          {market.outcomes && market.outcomes.length > 0 && (
            <div className="mb-4 space-y-1">
              {market.outcomes.slice(0, 3).map((outcome) => (
                <div
                  key={outcome.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground truncate mr-2">
                    {outcome.label}
                  </span>
                  <span className="font-medium">{outcome.probability}%</span>
                </div>
              ))}
              {market.outcomes.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  +{market.outcomes.length - 3} more
                </div>
              )}
            </div>
          )}

          {/* Stats Row */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              プール:{" "}
              <span className="text-foreground">
                {formatXrpCompact(market.totalPoolDrops)}
              </span>
            </div>
            {market.status !== "open" && (
              <Badge
                variant="outline"
                className={
                  market.status === "resolved"
                    ? "border-blue-500 text-blue-700"
                    : market.status === "closed"
                    ? "border-yellow-500 text-yellow-700"
                    : ""
                }
              >
                {market.status === "closed"
                  ? "クローズ"
                  : market.status === "resolved"
                  ? "解決済み"
                  : market.status}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
