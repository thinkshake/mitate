export type AdminOutcome = {
  id: string
  label: string
  probability: number
  totalBets: number
}

export type AdminMarket = {
  id: string
  title: string
  description: string
  category: string
  categoryLabel: string
  status: "open" | "closed" | "resolved"
  totalVolume: number
  endDate: string
  outcomes: AdminOutcome[]
  resolvedOutcome?: string
  tags?: string[]
}

export type Bettor = {
  name: string
  outcomeId: string
  amount: number
  weight: number
  effectiveAmount: number
}

export const initialAdminMarkets: AdminMarket[] = [
  {
    id: "1",
    title: "宮城県知事選挙の当選者予想",
    description: "2026年に予定される宮城県知事選挙の当選者を予測するマーケット",
    category: "politics",
    categoryLabel: "政治",
    status: "open",
    totalVolume: 1234500,
    endDate: "2026-06-15",
    outcomes: [
      { id: "1a", label: "村井嘉浩（現職）", probability: 42, totalBets: 518000 },
      { id: "1b", label: "新人候補A", probability: 28, totalBets: 345200 },
      { id: "1c", label: "新人候補B", probability: 18, totalBets: 222000 },
      { id: "1d", label: "その他", probability: 12, totalBets: 149300 },
    ],
  },
  {
    id: "2",
    title: "2026年の日本国内の米の平均価格帯",
    description: "2026年末時点での日本国内の米5kgあたりの平均小売価格を予測",
    category: "economy",
    categoryLabel: "経済",
    status: "open",
    totalVolume: 890200,
    endDate: "2026-12-31",
    outcomes: [
      { id: "2a", label: "¥2,500未満", probability: 15, totalBets: 133500 },
      { id: "2b", label: "¥2,500〜¥3,000", probability: 35, totalBets: 311600 },
      { id: "2c", label: "¥3,000〜¥3,500", probability: 33, totalBets: 293800 },
      { id: "2d", label: "¥3,500以上", probability: 17, totalBets: 151300 },
    ],
  },
  {
    id: "3",
    title: "受験期の渋谷駅周辺の交通混雑レベル",
    description: "2026年1-3月の受験シーズンにおける渋谷駅周辺の混雑度を予測",
    category: "local",
    categoryLabel: "地域",
    status: "closed",
    totalVolume: 456000,
    endDate: "2026-03-31",
    outcomes: [
      { id: "3a", label: "例年並み", probability: 40, totalBets: 182400 },
      { id: "3b", label: "やや混雑", probability: 35, totalBets: 159600 },
      { id: "3c", label: "大幅混雑", probability: 25, totalBets: 114000 },
    ],
  },
  {
    id: "4",
    title: "2026年 日銀の政策金利 年末時点",
    description: "2026年12月末時点の日銀政策金利の水準を予測",
    category: "economy",
    categoryLabel: "経済",
    status: "closed",
    totalVolume: 2150000,
    endDate: "2026-12-31",
    outcomes: [
      { id: "4a", label: "0.50%以下", probability: 20, totalBets: 430000 },
      { id: "4b", label: "0.50%〜0.75%", probability: 38, totalBets: 817000 },
      { id: "4c", label: "0.75%〜1.00%", probability: 28, totalBets: 602000 },
      { id: "4d", label: "1.00%以上", probability: 14, totalBets: 301000 },
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
      { id: "5a", label: "高市早苗", probability: 32, totalBets: 1094400 },
      { id: "5b", label: "小泉進次郎", probability: 25, totalBets: 855000 },
      { id: "5c", label: "河野太郎", probability: 18, totalBets: 615600 },
      { id: "5d", label: "石破茂", probability: 15, totalBets: 513000 },
      { id: "5e", label: "その他", probability: 10, totalBets: 342000 },
    ],
  },
  {
    id: "6",
    title: "2026年の訪日外国人観光客数",
    description: "2026年の年間訪日外国人数の範囲を予測",
    category: "economy",
    categoryLabel: "経済",
    status: "resolved",
    resolvedOutcome: "6b",
    totalVolume: 1780000,
    endDate: "2026-12-31",
    outcomes: [
      { id: "6a", label: "3,500万人未満", probability: 22, totalBets: 391600 },
      { id: "6b", label: "3,500〜4,000万人", probability: 45, totalBets: 801000 },
      { id: "6c", label: "4,000万人以上", probability: 33, totalBets: 587400 },
    ],
  },
]

export const mockBettors: Record<string, Bettor[]> = {
  "3": [
    { name: "田中太郎", outcomeId: "3a", amount: 2000, weight: 1.8, effectiveAmount: 3600 },
    { name: "佐藤花子", outcomeId: "3a", amount: 5000, weight: 1.2, effectiveAmount: 6000 },
    { name: "鈴木一郎", outcomeId: "3b", amount: 3000, weight: 2.0, effectiveAmount: 6000 },
    { name: "高橋美咲", outcomeId: "3a", amount: 1000, weight: 1.5, effectiveAmount: 1500 },
    { name: "渡辺健太", outcomeId: "3c", amount: 4000, weight: 1.0, effectiveAmount: 4000 },
    { name: "伊藤さくら", outcomeId: "3b", amount: 2500, weight: 1.3, effectiveAmount: 3250 },
    { name: "山本大輔", outcomeId: "3c", amount: 1500, weight: 2.2, effectiveAmount: 3300 },
    { name: "中村あかり", outcomeId: "3a", amount: 3500, weight: 1.0, effectiveAmount: 3500 },
  ],
  "4": [
    { name: "田中太郎", outcomeId: "4b", amount: 2000, weight: 1.2, effectiveAmount: 2400 },
    { name: "佐藤花子", outcomeId: "4a", amount: 8000, weight: 1.0, effectiveAmount: 8000 },
    { name: "鈴木一郎", outcomeId: "4b", amount: 10000, weight: 1.5, effectiveAmount: 15000 },
    { name: "高橋美咲", outcomeId: "4c", amount: 5000, weight: 1.8, effectiveAmount: 9000 },
    { name: "渡辺健太", outcomeId: "4b", amount: 3000, weight: 2.0, effectiveAmount: 6000 },
    { name: "伊藤さくら", outcomeId: "4d", amount: 4000, weight: 1.0, effectiveAmount: 4000 },
    { name: "山本大輔", outcomeId: "4c", amount: 6000, weight: 1.3, effectiveAmount: 7800 },
    { name: "中村あかり", outcomeId: "4a", amount: 2000, weight: 1.1, effectiveAmount: 2200 },
    { name: "小林優", outcomeId: "4b", amount: 7000, weight: 1.4, effectiveAmount: 9800 },
    { name: "加藤真理", outcomeId: "4c", amount: 3000, weight: 1.0, effectiveAmount: 3000 },
  ],
}

export const categoryOptions = [
  { value: "politics", label: "政治" },
  { value: "economy", label: "経済" },
  { value: "local", label: "地域" },
  { value: "culture", label: "文化" },
  { value: "tech", label: "テック" },
] as const

export function formatJPYC(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")} JPYC`
}
