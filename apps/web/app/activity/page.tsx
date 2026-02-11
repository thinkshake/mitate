import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Activity {
  id: number;
  type: "buy" | "sell" | "resolved";
  market: string;
  side: string;
  quantity: number;
  price?: number;
  total?: number;
  payout?: number;
  profit?: number;
  timestamp: string;
}

const activities: Activity[] = [
  {
    id: 1,
    type: "buy",
    market: "Will Bitcoin reach $100,000 by end of 2025?",
    side: "YES",
    quantity: 25,
    price: 62,
    total: 15.5,
    timestamp: "2 hours ago",
  },
  {
    id: 2,
    type: "sell",
    market: "Will the Fed cut rates in Q1 2025?",
    side: "YES",
    quantity: 30,
    price: 45,
    total: 13.5,
    timestamp: "5 hours ago",
  },
  {
    id: 3,
    type: "buy",
    market: "Will USA reach World Cup 2026 semifinals?",
    side: "YES",
    quantity: 100,
    price: 28,
    total: 28.0,
    timestamp: "1 day ago",
  },
  {
    id: 4,
    type: "resolved",
    market: "Will Ethereum complete the next major upgrade by Q2 2025?",
    side: "YES",
    quantity: 50,
    payout: 50.0,
    profit: 14.5,
    timestamp: "3 days ago",
  },
];

export default function ActivityPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">Activity</h1>
        <p className="text-gray-600">Your trading history and transactions</p>
      </div>

      {/* Activity List */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg text-black">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-gray-200">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="py-4 flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${
                        activity.type === "buy"
                          ? "bg-green-100"
                          : activity.type === "sell"
                          ? "bg-red-100"
                          : "bg-blue-100"
                      }
                    `}
                  >
                    {activity.type === "buy" && (
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 10l7-7m0 0l7 7m-7-7v18"
                        />
                      </svg>
                    )}
                    {activity.type === "sell" && (
                      <svg
                        className="w-5 h-5 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 14l-7 7m0 0l-7-7m7 7V3"
                        />
                      </svg>
                    )}
                    {activity.type === "resolved" && (
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-black line-clamp-1">
                      {activity.market}
                    </div>
                    <div className="text-sm text-gray-500">
                      {activity.type === "resolved" ? (
                        <>Resolved {activity.side} • {activity.quantity} contracts</>
                      ) : (
                        <>
                          {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}{" "}
                          {activity.quantity} {activity.side} @ {activity.price}¢
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-black">
                    {activity.type === "resolved" ? (
                      <>
                        +${activity.payout?.toFixed(2)}
                      </>
                    ) : activity.type === "buy" ? (
                      <>-${activity.total?.toFixed(2)}</>
                    ) : (
                      <>+${activity.total?.toFixed(2)}</>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">{activity.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
