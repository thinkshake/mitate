export type Attribute = {
  id: string
  type: "region" | "expertise" | "experience"
  typeLabel: string
  label: string
  weight: number
  verifiedAt: string
}

export type Bet = {
  id: string
  marketTitle: string
  outcomeLabel: string
  amount: number
  weight: number
  effectiveAmount: number
  currentProbability: number
  status: "open" | "closed"
  placedAt: string
}

export type UserData = {
  displayName: string
  walletAddress: string
  balance: number
  weightScore: number
  attributes: Attribute[]
  bets: Bet[]
}

export const initialUserData: UserData = {
  displayName: "田中太郎",
  walletAddress: "0x1a2B3c4D5e6F7a8B9c0D1e2F3a4B5c6D7e8F9fE3",
  balance: 12500,
  weightScore: 1.8,
  attributes: [
    {
      id: "attr1",
      type: "region",
      typeLabel: "地域",
      label: "宮城県在住",
      weight: 1.5,
      verifiedAt: "2026-01-10",
    },
    {
      id: "attr2",
      type: "expertise",
      typeLabel: "専門知識",
      label: "政治学専攻",
      weight: 1.2,
      verifiedAt: "2026-01-15",
    },
    {
      id: "attr3",
      type: "experience",
      typeLabel: "経験",
      label: "選挙ボランティア経験",
      weight: 1.1,
      verifiedAt: "2026-02-01",
    },
  ],
  bets: [
    {
      id: "bet1",
      marketTitle: "宮城県知事選挙の当選者予想",
      outcomeLabel: "村井嘉浩（現職）",
      amount: 1000,
      weight: 1.8,
      effectiveAmount: 1800,
      currentProbability: 42,
      status: "open",
      placedAt: "2026-02-10",
    },
    {
      id: "bet2",
      marketTitle: "2026年 日銀の政策金利 年末時点",
      outcomeLabel: "0.50%〜0.75%",
      amount: 2000,
      weight: 1.2,
      effectiveAmount: 2400,
      currentProbability: 38,
      status: "open",
      placedAt: "2026-02-08",
    },
    {
      id: "bet3",
      marketTitle: "2026年の訪日外国人観光客数",
      outcomeLabel: "3,500〜4,000万人",
      amount: 500,
      weight: 1.0,
      effectiveAmount: 500,
      currentProbability: 45,
      status: "closed",
      placedAt: "2026-01-20",
    },
  ],
}

export function calculateWeightScore(attributes: Attribute[]): number {
  const base = 0.5
  const sum = attributes.reduce((acc, attr) => acc + (attr.weight - 1.0), 0)
  return Math.min(3.0, Math.max(0.5, Math.round((base + sum) * 10) / 10))
}

export function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export const defaultWeights: Record<string, number> = {
  region: 1.3,
  expertise: 1.0,
  experience: 0.8,
}

export const typeOptions = [
  { value: "region", label: "地域", typeLabel: "地域" },
  { value: "expertise", label: "専門知識", typeLabel: "専門知識" },
  { value: "experience", label: "経験", typeLabel: "経験" },
] as const
