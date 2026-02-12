"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { type Attribute, defaultWeights, typeOptions } from "@/lib/user-data"

type AttributeManagementProps = {
  attributes: Attribute[]
  onDelete: (id: string) => void
  onAdd: (attr: Omit<Attribute, "id" | "verifiedAt">) => void
}

export function AttributeManagement({
  attributes,
  onDelete,
  onAdd,
}: AttributeManagementProps) {
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<string>("region")
  const [formLabel, setFormLabel] = useState("")

  const selectedTypeOption = typeOptions.find((t) => t.value === formType)
  const previewWeight = defaultWeights[formType] ?? 1.0

  function handleSubmit() {
    if (!formLabel.trim()) return
    onAdd({
      type: formType as Attribute["type"],
      typeLabel: selectedTypeOption?.typeLabel ?? "",
      label: formLabel.trim(),
      weight: previewWeight,
    })
    setFormLabel("")
    setFormType("region")
    setShowForm(false)
  }

  return (
    <section aria-label="属性管理" className="mt-12">
      <h2 className="text-lg font-bold text-foreground">あなたの属性</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        属性はマーケットの予測精度に影響する重みスコアの根拠となります
      </p>

      {/* Attribute list */}
      <div className="mt-6 flex flex-col gap-3">
        {attributes.map((attr) => (
          <div
            key={attr.id}
            className="flex items-center justify-between rounded-lg border border-border px-5 py-4"
          >
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
              <span className="inline-flex w-fit rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                {attr.typeLabel}
              </span>
              <span className="text-sm font-medium text-foreground">
                {attr.label}
              </span>
              <span className="font-mono text-sm text-foreground">
                {"\u00D7"}{attr.weight.toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground">
                {attr.verifiedAt} 認証済み
              </span>
            </div>
            <button
              onClick={() => onDelete(attr.id)}
              className="shrink-0 text-xs text-destructive transition-opacity hover:opacity-70"
            >
              削除
            </button>
          </div>
        ))}

        {attributes.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            属性がまだ登録されていません
          </p>
        )}
      </div>

      {/* Add attribute */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="mt-4 rounded border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
        >
          属性を追加
        </button>
      ) : (
        <div className="mt-4 rounded-lg border border-border p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="attr-type" className="text-xs text-muted-foreground">
                タイプ
              </label>
              <select
                id="attr-type"
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground"
              >
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-1 flex-col gap-1.5">
              <label htmlFor="attr-label" className="text-xs text-muted-foreground">
                ラベル
              </label>
              <input
                id="attr-label"
                type="text"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder="例: 東京都在住"
                className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-foreground"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit()
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">重み</span>
              <span className="rounded border border-border bg-muted px-3 py-2 font-mono text-sm text-foreground">
                {"\u00D7"}{previewWeight.toFixed(1)}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={!formLabel.trim()}
                className={cn(
                  "rounded bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity",
                  !formLabel.trim() ? "cursor-not-allowed opacity-40" : "hover:opacity-80"
                )}
              >
                追加する
              </button>
              <button
                onClick={() => {
                  setShowForm(false)
                  setFormLabel("")
                }}
                className="rounded border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Weight explanation */}
      <div className="mt-6 rounded-lg border border-border bg-muted/50 px-5 py-4">
        <p className="text-xs leading-relaxed text-muted-foreground">
          重みスコアの計算方法: 基本スコア0.5に各属性の重み係数から1.0を引いた値を加算します。
          地域属性: {"\u00D7"}1.0〜2.0、専門知識: {"\u00D7"}0.5〜1.5、経験: {"\u00D7"}0.3〜1.0
          （スコア範囲: 0.5〜3.0）
        </p>
      </div>
    </section>
  )
}
