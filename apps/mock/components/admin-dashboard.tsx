"use client"

import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { initialAdminMarkets, type AdminMarket } from "@/lib/admin-data"
import { AdminLogin } from "@/components/admin-login"
import { AdminHeader } from "@/components/admin-header"
import { AdminMarketsTable } from "@/components/admin-markets-table"
import { AdminCreateMarket } from "@/components/admin-create-market"
import { AdminResolvePanel } from "@/components/admin-resolve-panel"

const tabs = [
  { id: "manage", label: "マーケット管理" },
  { id: "resolve", label: "結果確定 / 配当" },
] as const

type TabId = (typeof tabs)[number]["id"]

export function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>("manage")
  const [markets, setMarkets] = useState<AdminMarket[]>(initialAdminMarkets)
  const [preSelectedResolveId, setPreSelectedResolveId] = useState<string | null>(null)

  const handleCloseMarket = useCallback((id: string) => {
    setMarkets((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: "closed" as const } : m))
    )
  }, [])

  const handleGoToResolve = useCallback((id: string) => {
    setPreSelectedResolveId(id)
    setActiveTab("resolve")
  }, [])

  const handleCreateMarket = useCallback((market: AdminMarket) => {
    setMarkets((prev) => [...prev, market])
  }, [])

  const handleResolve = useCallback((marketId: string, outcomeId: string) => {
    setMarkets((prev) =>
      prev.map((m) =>
        m.id === marketId ? { ...m, status: "resolved" as const, resolvedOutcome: outcomeId } : m
      )
    )
  }, [])

  if (!isLoggedIn) {
    return <AdminLogin onLogin={() => setIsLoggedIn(true)} />
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader onLogout={() => setIsLoggedIn(false)} />

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <div className="mx-auto flex max-w-6xl gap-0 px-4 lg:px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                if (tab.id === "manage") setPreSelectedResolveId(null)
              }}
              className={cn(
                "relative px-4 py-3 text-sm transition-colors",
                activeTab === tab.id
                  ? "text-foreground after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8 lg:px-6">
        {activeTab === "manage" && (
          <div>
            <h2 className="text-lg font-bold text-foreground">マーケット管理</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              マーケットの一覧、ステータス管理、新規作成
            </p>
            <div className="mt-6">
              <AdminMarketsTable
                markets={markets}
                onCloseMarket={handleCloseMarket}
                onGoToResolve={handleGoToResolve}
              />
            </div>
            <AdminCreateMarket onCreateMarket={handleCreateMarket} />
          </div>
        )}

        {activeTab === "resolve" && (
          <div>
            <h2 className="text-lg font-bold text-foreground">結果確定 / 配当</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              クローズ済みマーケットの結果確定と配当シミュレーション
            </p>
            <div className="mt-6">
              <AdminResolvePanel
                markets={markets}
                preSelectedMarketId={preSelectedResolveId}
                onResolve={handleResolve}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
