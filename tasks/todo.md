# Todo

## Done

- [x] Migrate binnenwanderungsziffer from vanilla HTML/CSS/JS → React + Vite + TS + Tailwind v4 + D3
- [x] D3 strictly for calculations only (scales, math) — React renders all SVG
- [x] Intro animation (5-phase state machine)
- [x] Node interaction: hover, pin, tooltip
- [x] Breathing + pulse-ring animation on pinned node
- [x] Particle flow animation (SVG animateMotion) on pinned node
- [x] Landing page shell: munich/index.html (vanilla HTML/CSS)
- [x] shared/style.css with design tokens
- [x] GitHub repo: hihuydo/munich-viz (munich/ as git root)
- [x] Vercel deployment: https://munich-xi.vercel.app
  - Build: `cd binnenwanderungsziffer && npm install && npm run build`
  - Output: `.` (entire munich/ dir)
- [x] Local serve: `pnpm serve` → python3 http.server 8080
- [x] Achromatic redesign: white bg, black text, green + orange only chromatic accents
- [x] Shared tokens.css as single source of truth (consumed by index.html + Vite app)
- [x] ChartControls: new fixed overlay for category toggle + year slider (decoupled from Sidebar)
- [x] Sidebar: floating fixed panel, all SectionCards collapsed by default, no phase gate on visibility
- [x] CenterLabel: year only (no circle, no city name), font size doubled
- [x] Tooltip: smart quad placement to avoid covering hovered node; rightPad for sidebar clearance
- [x] Card style system: white bg + 1px solid black border on SectionCard, KpiCard, MetricPill, Tooltip
- [x] Design system separation: shared/ = landing page only; each project self-contained CSS

## In Progress

- [ ] Connect GitHub repo to Vercel for auto-deploy on push
  (currently manual: `vercel --prod --yes` from munich/)

## Next

- [ ] Add label overlay on hover (district name next to node)
- [ ] Add more Munich visualizations as new cards on index.html
- [ ] Consider adding a `pnpm build` script at munich/ root to build + serve in one step
