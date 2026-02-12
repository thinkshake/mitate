export type Outcome = {
  id: string
  label: string
  probability: number
}

export type Market = {
  id: string
  title: string
  description: string
  category: string
  categoryLabel: string
  status: "open" | "closed" | "resolved"
  totalVolume: number
  endDate: string
  outcomes: Outcome[]
}

export const markets: Market[] = [
  {
    id: "1",
    title: "宮城県知事選挙の当選者予想",
    description:
      "2026年に予定される宮城県知事選挙の当選者を予測するマーケット",
    category: "politics",
    categoryLabel: "政治",
    status: "open",
    totalVolume: 1234500,
    endDate: "2026-06-15",
    outcomes: [
      { id: "1a", label: "村井嘉浩（現職）", probability: 42 },
      { id: "1b", label: "新人候補A", probability: 28 },
      { id: "1c", label: "新人候補B", probability: 18 },
      { id: "1d", label: "その他", probability: 12 },
    ],
  },
  {
    id: "2",
    title: "2026年の日本国内の米の平均価格帯",
    description:
      "2026年末時点での日本国内の米5kgあたりの平均小売価格を予測",
    category: "economy",
    categoryLabel: "経済",
    status: "open",
    totalVolume: 890200,
    endDate: "2026-12-31",
    outcomes: [
      { id: "2a", label: "¥2,500未満", probability: 15 },
      { id: "2b", label: "¥2,500〜¥3,000", probability: 35 },
      { id: "2c", label: "¥3,000〜¥3,500", probability: 33 },
      { id: "2d", label: "¥3,500以上", probability: 17 },
    ],
  },
  {
    id: "3",
    title: "受験期の渋谷駅周辺の交通混雑レベル",
    description:
      "2026年1-3月の受験シーズンにおける渋谷駅周辺の混雑度を予測",
    category: "local",
    categoryLabel: "地域",
    status: "open",
    totalVolume: 456000,
    endDate: "2026-03-31",
    outcomes: [
      { id: "3a", label: "例年並み", probability: 40 },
      { id: "3b", label: "やや混雑", probability: 35 },
      { id: "3c", label: "大幅混雑", probability: 25 },
    ],
  },
  {
    id: "4",
    title: "2026年 日銀の政策金利 年末時点",
    description: "2026年12月末時点の日銀政策金利の水準を予測",
    category: "economy",
    categoryLabel: "経済",
    status: "open",
    totalVolume: 2150000,
    endDate: "2026-12-31",
    outcomes: [
      { id: "4a", label: "0.50%以下", probability: 20 },
      { id: "4b", label: "0.50%〜0.75%", probability: 38 },
      { id: "4c", label: "0.75%〜1.00%", probability: 28 },
      { id: "4d", label: "1.00%以上", probability: 14 },
    ],
  },
  {
    id: "5",
    title: "次期自民党総裁は誰か",
    description: "次回の自民党総裁選挙における当選者を予測",
    category: "politics",
    categoryLabel: "政治",
    status: "open",
    totalVolume: 3420000,
    endDate: "2027-09-30",
    outcomes: [
      { id: "5a", label: "高市早苗", probability: 32 },
      { id: "5b", label: "小泉進次郎", probability: 25 },
      { id: "5c", label: "河野太郎", probability: 18 },
      { id: "5d", label: "石破茂", probability: 15 },
      { id: "5e", label: "その他", probability: 10 },
    ],
  },
  {
    id: "6",
    title: "2026年の訪日外国人観光客数",
    description: "2026年の年間訪日外国人数の範囲を予測",
    category: "economy",
    categoryLabel: "経済",
    status: "closed",
    totalVolume: 1780000,
    endDate: "2026-12-31",
    outcomes: [
      { id: "6a", label: "3,500万人未満", probability: 22 },
      { id: "6b", label: "3,500〜4,000万人", probability: 45 },
      { id: "6c", label: "4,000万人以上", probability: 33 },
    ],
  },
]

export const categories = [
  { value: "all", label: "すべて" },
  { value: "politics", label: "政治" },
  { value: "economy", label: "経済" },
  { value: "local", label: "地域" },
  { value: "culture", label: "文化" },
  { value: "tech", label: "テック" },
] as const

export const statuses = [
  { value: "all", label: "すべて" },
  { value: "open", label: "オープン" },
  { value: "closed", label: "クローズ" },
  { value: "resolved", label: "解決済み" },
] as const

export function formatVolume(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")} JPYC`
}
