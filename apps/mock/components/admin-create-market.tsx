"use client"

import { useState, type FormEvent } from "react"
import { categoryOptions, type AdminMarket } from "@/lib/admin-data"

type FormErrors = {
  title?: string
  description?: string
  endDate?: string
  outcomes?: string
}

export function AdminCreateMarket({ onCreateMarket }: { onCreateMarket: (market: AdminMarket) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("politics")
  const [endDate, setEndDate] = useState("")
  const [tags, setTags] = useState("")
  const [outcomeLabels, setOutcomeLabels] = useState(["", ""])
  const [errors, setErrors] = useState<FormErrors>({})
  const [showSuccess, setShowSuccess] = useState(false)

  const maxOutcomes = 8

  function addOutcome() {
    if (outcomeLabels.length < maxOutcomes) {
      setOutcomeLabels([...outcomeLabels, ""])
    }
  }

  function removeOutcome(index: number) {
    if (outcomeLabels.length > 2) {
      setOutcomeLabels(outcomeLabels.filter((_, i) => i !== index))
    }
  }

  function updateOutcome(index: number, value: string) {
    const updated = [...outcomeLabels]
    updated[index] = value
    setOutcomeLabels(updated)
  }

  function getEqualProbabilities(count: number): number[] {
    const base = Math.floor(100 / count)
    const remainder = 100 - base * count
    return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0))
  }

  function validate(): FormErrors {
    const errs: FormErrors = {}
    if (!title.trim()) errs.title = "必須項目です"
    if (!description.trim()) errs.description = "必須項目です"
    if (!endDate) errs.endDate = "必須項目です"
    const nonEmpty = outcomeLabels.filter((l) => l.trim())
    if (nonEmpty.length < 2) errs.outcomes = "最低2つの選択肢にラベルを入力してください"
    return errs
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    const filledLabels = outcomeLabels.filter((l) => l.trim())
    const probs = getEqualProbabilities(filledLabels.length)
    const catOption = categoryOptions.find((c) => c.value === category)
    const newId = `new-${Date.now()}`

    const newMarket: AdminMarket = {
      id: newId,
      title: title.trim(),
      description: description.trim(),
      category,
      categoryLabel: catOption?.label ?? "政治",
      status: "open",
      totalVolume: 0,
      endDate,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      outcomes: filledLabels.map((label, i) => ({
        id: `${newId}-${i}`,
        label: label.trim(),
        probability: probs[i],
        totalBets: 0,
      })),
    }

    onCreateMarket(newMarket)
    setTitle("")
    setDescription("")
    setCategory("politics")
    setEndDate("")
    setTags("")
    setOutcomeLabels(["", ""])
    setErrors({})
    setIsOpen(false)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const probabilities = getEqualProbabilities(outcomeLabels.length)
  const filledLabels = outcomeLabels.filter((l) => l.trim())
  const catLabel = categoryOptions.find((c) => c.value === category)?.label ?? "政治"

  return (
    <div className="mt-8">
      {showSuccess && (
        <div className="mb-4 rounded-md border border-[#16A34A]/30 bg-[#16A34A]/5 px-4 py-3 text-sm text-[#16A34A]">
          作成しました
        </div>
      )}

      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
        >
          ＋ 新規作成
        </button>
      ) : (
        <div className="rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">新規マーケット作成</h3>
            <button
              onClick={() => {
                setIsOpen(false)
                setErrors({})
              }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              閉じる
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="market-title" className="text-sm font-medium text-foreground">
                タイトル
              </label>
              <input
                id="market-title"
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value); if (errors.title) setErrors((p) => ({ ...p, title: undefined })) }}
                placeholder="例: 2027年の日経平均株価レンジ"
                className={`h-10 rounded-md border bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-foreground ${errors.title ? "border-[#DC2626]" : "border-input"}`}
              />
              {errors.title && <p className="text-xs text-[#DC2626]">{errors.title}</p>}
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="market-desc" className="text-sm font-medium text-foreground">
                説明文
              </label>
              <textarea
                id="market-desc"
                value={description}
                onChange={(e) => { setDescription(e.target.value); if (errors.description) setErrors((p) => ({ ...p, description: undefined })) }}
                placeholder="マーケットの詳細な説明..."
                rows={3}
                className={`rounded-md border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-foreground ${errors.description ? "border-[#DC2626]" : "border-input"}`}
              />
              {errors.description && <p className="text-xs text-[#DC2626]">{errors.description}</p>}
            </div>

            {/* Category + End Date */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="market-cat" className="text-sm font-medium text-foreground">
                  カテゴリ
                </label>
                <select
                  id="market-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-foreground"
                >
                  {categoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="market-end" className="text-sm font-medium text-foreground">
                  終了日
                </label>
                <input
                  id="market-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); if (errors.endDate) setErrors((p) => ({ ...p, endDate: undefined })) }}
                  className={`h-10 rounded-md border bg-background px-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-foreground ${errors.endDate ? "border-[#DC2626]" : "border-input"}`}
                />
                {errors.endDate && <p className="text-xs text-[#DC2626]">{errors.endDate}</p>}
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="market-tags" className="text-sm font-medium text-foreground">
                タグ
              </label>
              <input
                id="market-tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="例: 選挙, 宮城, 地方政治"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-foreground"
              />
            </div>

            {/* Outcomes */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  選択肢 ({outcomeLabels.length})
                </span>
                {outcomeLabels.length < maxOutcomes && (
                  <button
                    type="button"
                    onClick={addOutcome}
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    ＋ 選択肢を追加
                  </button>
                )}
              </div>

              {outcomeLabels.map((label, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-5 shrink-0 text-right font-mono text-xs text-muted-foreground">{i + 1}</span>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => updateOutcome(i, e.target.value)}
                    placeholder={`選択肢 ${i + 1}`}
                    className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-foreground"
                  />
                  <span className="w-12 shrink-0 text-right font-mono text-xs text-muted-foreground">
                    {probabilities[i]}%
                  </span>
                  <button
                    type="button"
                    onClick={() => removeOutcome(i)}
                    disabled={outcomeLabels.length <= 2}
                    className={`shrink-0 text-xs ${
                      outcomeLabels.length <= 2
                        ? "cursor-not-allowed text-muted-foreground/40"
                        : "text-[#DC2626] hover:text-[#DC2626]/80"
                    }`}
                    title={outcomeLabels.length <= 2 ? "最低2つの選択肢が必要です" : "削除"}
                  >
                    削除
                  </button>
                </div>
              ))}
              {outcomeLabels.length <= 2 && (
                <p className="text-xs text-muted-foreground">最低2つの選択肢が必要です</p>
              )}
              {errors.outcomes && <p className="text-xs text-[#DC2626]">{errors.outcomes}</p>}
            </div>

            {/* Live Preview */}
            {(title.trim() || filledLabels.length >= 2) && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-muted-foreground">プレビュー</span>
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                      {catLabel}
                    </span>
                    <span className="rounded-full bg-foreground px-2.5 py-0.5 text-xs text-background">
                      オープン
                    </span>
                  </div>
                  {title.trim() && (
                    <p className="mt-2 text-sm font-bold text-foreground">{title}</p>
                  )}
                  {filledLabels.length >= 2 && (
                    <div className="mt-3 flex flex-col gap-2.5">
                      {filledLabels.slice(0, 2).map((l, i) => {
                        const prob = probabilities[outcomeLabels.indexOf(
                          outcomeLabels.find((ol) => ol.trim() === l) ?? ""
                        )]
                        return (
                          <div key={i} className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-foreground">{l}</span>
                              <span className="font-mono text-xs text-foreground">{prob}%</span>
                            </div>
                            <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
                              <div
                                className="h-full rounded-full bg-foreground transition-all duration-300"
                                style={{ width: `${prob}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
                    <span className="text-xs text-muted-foreground">
                      総取引量: <span className="font-mono">¥0 JPYC</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      終了: <span className="font-mono">{endDate || "---"}</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="h-10 w-full rounded-md bg-foreground text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              マーケットを作成
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
