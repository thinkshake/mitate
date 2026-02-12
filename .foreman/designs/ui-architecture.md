# UI Architecture

## Directory Structure

```
apps/web/
├── app/
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Homepage (market list)
│   ├── market/
│   │   └── [id]/
│   │       └── page.tsx     # Market detail
│   └── mypage/
│       └── page.tsx         # Portfolio/positions
├── components/
│   ├── site-header.tsx      # Header with wallet
│   ├── market-card.tsx      # Market list item
│   ├── markets-grid.tsx     # Market grid container
│   ├── filter-bar.tsx       # Category/status filters
│   ├── market-detail.tsx    # Full market view
│   ├── outcomes-list.tsx    # Outcome selection
│   ├── bet-panel.tsx        # Betting interface
│   ├── market-info-box.tsx  # Market stats
│   ├── position-box.tsx     # User's positions
│   ├── profile-section.tsx  # User attributes
│   ├── active-bets.tsx      # Portfolio bets list
│   └── ui/                  # shadcn components
├── contexts/
│   └── WalletContext.tsx    # GemWallet state
├── hooks/
│   ├── useMarkets.ts        # Market data fetching
│   ├── useUser.ts           # User attributes/bets
│   └── useMobile.ts         # Responsive detection
├── lib/
│   ├── api.ts               # API client
│   └── utils.ts             # Utilities
└── styles/
    └── globals.css          # Tailwind + custom
```

## Component Migration Map

| apps/mock | apps/web (new) | Changes |
|-----------|---------------|---------|
| site-header.tsx | site-header.tsx | Add GemWallet, XRP balance |
| market-card.tsx | market-card.tsx | Fetch from API, XRP amounts |
| market-detail.tsx | market-detail.tsx | API integration, wallet tx |
| bet-panel.tsx | bet-panel.tsx | GemWallet signing, XRP |
| outcomes-list.tsx | outcomes-list.tsx | Minimal changes |
| filter-bar.tsx | filter-bar.tsx | Minimal changes |
| my-page.tsx | mypage/page.tsx | API integration |
| profile-section.tsx | profile-section.tsx | API integration |
| active-bets.tsx | active-bets.tsx | API integration |
| ❌ admin-*.tsx | (skipped) | Admin via API only |

## State Management

### WalletContext (existing, enhanced)
```typescript
interface WalletState {
  connected: boolean;
  address: string | null;
  network: string | null;
  balance: string | null;  // NEW: XRP balance in drops
  loading: boolean;
  error: string | null;
  gemWalletInstalled: boolean;
}

interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  signAndSubmitTransaction: (tx: unknown) => Promise<{ hash: string } | null>;
  refreshBalance: () => Promise<void>;  // NEW
}
```

### UserContext (new)
```typescript
interface UserState {
  attributes: Attribute[];
  weightScore: number;
  loading: boolean;
}

interface UserContextType extends UserState {
  fetchAttributes: (address: string) => Promise<void>;
  addAttribute: (attr: NewAttribute) => Promise<void>;
}
```

## Data Flow

### Market List Page
```
Page Load
  → useMarkets(filters)
  → GET /markets?category=X&status=Y
  → Render MarketCard[] with real probabilities
```

### Market Detail Page
```
Page Load
  → useMarket(id)
  → GET /markets/:id
  → Render outcomes, bet panel

Bet Flow
  → User selects outcome, enters amount
  → POST /markets/:id/bets (get unsigned tx)
  → signAndSubmitTransaction(tx)
  → POST /markets/:id/bets/:id/confirm
  → Refetch market data
```

### My Page
```
Page Load
  → useUser(address)
  → GET /users/:address/attributes
  → GET /users/:address/bets
  → Render profile + positions
```

## Currency Display

Convert JPYC references to XRP:

```typescript
// apps/mock (JPYC)
formatVolume(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")} JPYC`
}

// apps/web (XRP)
formatXrp(drops: string): string {
  const xrp = Number(drops) / 1_000_000;
  return `${xrp.toLocaleString("ja-JP")} XRP`;
}
```

UI changes:
- "¥12,500 JPYC" → "12.5 XRP"
- Quick amounts: 100, 500, 1000, 5000 JPYC → 1, 5, 10, 50 XRP
- All internal amounts in drops (1 XRP = 1,000,000 drops)

## Japanese Text

Keep all UI text in Japanese from apps/mock:
- Navigation: マーケット, マイページ
- Buttons: 予測する, 接続中
- Labels: ベット金額, 利用可能, 重みスコア
- Status: オープン, クローズ, 解決済み

## Responsive Design

apps/mock already has mobile support via:
- `use-mobile.tsx` hook
- Tailwind responsive classes (`lg:`, `md:`, `sm:`)
- Flexible grid layouts

Preserve all responsive behavior.

## shadcn/ui Components Used

From apps/mock (to migrate):
- Button, Card, Input, Label
- Select, Tabs, Badge
- Dialog, DropdownMenu
- Tooltip, Toast

Already in apps/web:
- Button, Card, Input
- DropdownMenu, Separator
- Tabs, Badge
