import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PortfolioPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">Portfolio</h1>
        <p className="text-gray-600">Track your positions and performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="text-sm text-gray-500 mb-1">Total Value</div>
            <div className="text-2xl font-bold text-black">$1,247.50</div>
            <div className="text-sm text-green-600">+$142.30 (12.8%)</div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="text-sm text-gray-500 mb-1">Available Cash</div>
            <div className="text-2xl font-bold text-black">$523.00</div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="text-sm text-gray-500 mb-1">Open Positions</div>
            <div className="text-2xl font-bold text-black">8</div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="text-sm text-gray-500 mb-1">Win Rate</div>
            <div className="text-2xl font-bold text-black">67%</div>
          </CardContent>
        </Card>
      </div>

      {/* Positions */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg text-black">Open Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-gray-200">
            {/* Position 1 */}
            <div className="py-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-black">
                  Will Bitcoin reach $100,000 by end of 2025?
                </div>
                <div className="text-sm text-gray-500">
                  25 contracts • YES @ 62¢
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-black">$18.75</div>
                <div className="text-sm text-green-600">+$3.25 (+21.0%)</div>
              </div>
            </div>
            {/* Position 2 */}
            <div className="py-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-black">
                  Will the Fed cut rates in Q1 2025?
                </div>
                <div className="text-sm text-gray-500">
                  50 contracts • NO @ 55¢
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-black">$29.00</div>
                <div className="text-sm text-green-600">+$1.50 (+5.5%)</div>
              </div>
            </div>
            {/* Position 3 */}
            <div className="py-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-black">
                  Will USA reach World Cup 2026 semifinals?
                </div>
                <div className="text-sm text-gray-500">
                  100 contracts • YES @ 28¢
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-black">$31.00</div>
                <div className="text-sm text-red-500">-$2.00 (-6.1%)</div>
              </div>
            </div>
          </div>
          <div className="pt-4">
            <Button
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              View All Positions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
