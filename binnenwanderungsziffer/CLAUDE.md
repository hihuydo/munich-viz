# Binnenwanderungsziffer München — CLAUDE.md

## Stack

- **Framework:** React 19 + TypeScript ~5.8 + Vite 6
- **Styling:** Tailwind CSS v4 (via @tailwindcss/vite), design tokens in `src/index.css`
- **Visualization:** D3.js 7 (scales & math only — no DOM), SVG rendered via React
- **Icons:** lucide-react
- **Package manager:** pnpm (always — never npm or yarn)
- **Deployment:** Vercel (`pnpm build` → `dist/`)

## Commands

```bash
pnpm dev        # Start Vite dev server (http://localhost:5173)
pnpm build      # TypeScript check + Vite build → dist/
pnpm preview    # Preview production build locally
```

## Architecture

```
src/
├── components/
│   ├── App.tsx              # Root state (year, category, hover, pin)
│   ├── RadialChart.tsx      # Chart orchestrator, resize observer, phase logic
│   ├── Sidebar.tsx          # Year slider, category selector, stats, detail card
│   ├── NodeRing.tsx         # 25 district nodes on ring
│   ├── CurveLayer.tsx       # Bezier connections (top 5 inflow ↔ outflow)
│   ├── ParticleLayer.tsx    # Flowing particles along curves
│   ├── BackgroundRings.tsx  # Concentric background rings
│   ├── CenterLabel.tsx      # Center circle label
│   ├── GlowDefs.tsx         # SVG filter defs (glow effects)
│   ├── Tooltip.tsx          # Hover/pin detail card
│   └── TrendSparkline.tsx   # Mini trend chart in sidebar
├── hooks/
│   ├── useChartData.ts      # Data loading & caching (filter by year/category)
│   ├── useIntroAnimation.ts # 5-phase intro sequence
│   ├── useMediaQuery.ts     # Responsive breakpoints (<768px = compact)
│   └── useScales.ts         # D3 scales for node size, opacity, curve width
├── lib/
│   ├── chartMath.ts         # Layout, colors, bezier paths, rankings, getTop5()
│   └── utils.ts             # Utility functions
├── data/
│   └── types.ts             # TypeScript interfaces
├── index.css                # Design tokens + Tailwind imports
└── main.tsx                 # Entry point

data/
└── binnenwanderung.json     # Raw dataset (~1954 lines, 25 districts × 3 categories × N years)
```

## Key Design Decisions

- **SVG-based rendering** — no canvas, no external chart library
- **D3 for math only** — scales, paths, positioning; React owns the DOM
- `base: './'` in vite.config.ts — relative asset paths for static deployment
- **Self-contained tokens** — `src/index.css` owns all CSS vars; not dependent on shared tokens
- **Responsive:** Desktop (>768px) = sidebar right; compact (≤768px) = sidebar bottom sheet

## Data Model

**File:** `data/binnenwanderung.json`

Key fields per record:
- `auspragung`: `"deutsch"` | `"nichtdeutsch"` | `"insgesamt"`
- `jahr`: year (number)
- `raumbezug`: district name, e.g. `"01 Altstadt - Lehel"` (25 total)
- `indikatorwert`: net migration per 1,000 residents (+ = inflow, − = outflow)
- `zugezogene`: inflow count
- `weggezogene`: outflow count
- `bevoelkerung`: population

## Design Tokens (src/index.css)

| Token | Value | Use |
|-------|-------|-----|
| `--color-positive-strong` | `#22c55e` | inflow > +10 |
| `--color-positive-soft` | `#4ade80` | inflow 0–10 |
| `--color-negative-strong` | `#f97316` | outflow < −10 |
| `--color-negative-soft` | `#fb923c` | outflow 0–−10 |
| `--color-neutral` | `#a0a0a0` | value = 0 |

## Known Gotchas

- **SVG SMIL + CSS vars:** `fill` in SMIL animations (`<animate>`) does NOT support `var(--token)` — use literal hex values instead (see commit `984793e`)
- **Vercel deploy:** Uses `framework: null` in vercel.json (static site, not a Next.js app)
- **Index.html** references `../shared/style.css` for outer shell — this is separate from Tailwind tokens in src/

## Project Memory

- `tasks/todo.md` — current work in progress, next steps
- `tasks/lessons.md` — reusable patterns, bugs, deployment pitfalls

Always read both files at session start before touching code.
