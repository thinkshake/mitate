# MITATE - Prediction Market UI Prototype

A UI prototype of a prediction market platform, built with Next.js 16, TypeScript, and Tailwind CSS. This is a presentation-only prototype with mock data and no backend.

## Features

- **Homepage** - Featured markets, categories, trending markets
- **Markets listing** - Browse, filter, and search markets by category
- **Market detail** - Trading interface with Yes/No contracts, price display, and order panel
- **Portfolio** - Mock portfolio with positions and performance stats
- **Activity** - Transaction history display
- **Learn** - Educational content placeholder

## Design Principles

Built following a Web3 dApps UI Design Guide:

- **Minimal color usage** - 95% neutral colors (white, grays, black)
- **Semantic colors only** - Green for success, red for error, yellow for warning, blue for info
- **Light mode only** - No dark mode
- **Clean interactions** - Black primary buttons, subtle hover states
- **Responsive** - Mobile-first design with desktop enhancements

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Components:** shadcn/ui
- **Runtime:** Bun

## Getting Started

```bash
# Install dependencies
bun install

# Run development server
bun dev

# Build for production
bun run build

# Start production server
bun start
```

## Structure

```
mitate/
├── app/
│   ├── page.tsx              # Homepage
│   ├── layout.tsx            # Root layout with header/footer
│   ├── markets/
│   │   ├── page.tsx          # Markets listing
│   │   └── [id]/page.tsx     # Market detail with trading UI
│   ├── portfolio/page.tsx    # Portfolio view
│   ├── activity/page.tsx     # Activity/history
│   └── learn/page.tsx        # Educational content
├── components/
│   ├── header.tsx            # Navigation header with wallet button
│   ├── market-card.tsx       # Market card component
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── mock-data.ts          # Mock markets and categories
│   └── utils.ts              # Utility functions
└── ...
```

## Notes

- This is a **prototype for presentation only**
- No backend / API integration
- No authentication system (wallet connect is a mock)
- Uses mock data for markets, positions, and activity
- Designed for desktop and mobile viewing

## License

MIT
