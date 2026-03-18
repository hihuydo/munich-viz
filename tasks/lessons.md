# Lessons

## Deployment

### Vercel: pnpm@10 URLSearchParams bug
- **Symptom:** `ERR_PNPM_META_FETCH_FAIL: Value of "this" must be of type URLSearchParams` on Vercel build
- **Cause:** pnpm@10 incompatible with Vercel's Node.js version; lockfile format mismatch
- **Fix:** Use `npm install && npm run build` in vercel.json buildCommand instead of pnpm

### Vercel: relative asset paths in subdir
- **Symptom:** App renders blank when served from `/subdir/dist/` — JS/CSS 404
- **Cause:** `serve` package redirects `/subdir/dist/index.html` → `/subdir/dist` (no trailing slash), breaking relative `./assets/` resolution
- **Fix:** Use `python3 -m http.server` instead of `serve` for local static serving; Vite config needs `base: './'`

### Vercel: outputDirectory = "." for multi-app shell
- Serving the whole `munich/` dir (shell + built sub-apps) requires `"outputDirectory": "."` in vercel.json
- Build command must cd into the sub-app and build there

## Architecture

### D3 + React separation
- D3 only for: `scaleSqrt`, `scaleLinear`, `max`, `bezierPath` math → lives in `lib/` and `hooks/`
- React renders all SVG elements as JSX — no `d3.select()` on DOM
- Intro animation via phase state machine (0→5), CSS transitions on SVG elements

### Shared Munich design system
- `shared/` is the design system for the **landing page only** (`munich/index.html`)
- Each visualization project owns its own CSS — no cross-project `@import` from `shared/`
- `shared/style.css` = tokens + base reset, consumed only by `index.html`
- `shared/landing.css` = card grid + shell layout for `index.html`
- New projects: define all tokens inline in the project's own CSS (copy the token block from binnenwanderungsziffer/src/index.css as a starting point)
- Keep accent color values consistent across projects: green `#4ade80`, orange `#fb923c`
- `index.html` should stay structurally light; shared visual rules belong in `shared/landing.css`, not in page-local `<style>` blocks
- When type size increases globally, re-check both landing cards and sidebar KPI blocks for overflow before calling the design done
- For German UI copy, long labels such as `Langfristiger Schnitt` need roomier containers than pill-shaped badges; use rounded cards for multi-line metrics

### Design change rule
- If a design decision should affect all projects in `munich/`, do not hardcode it in `index.html` or a single app component
- Prefer semantic CSS variables like `var(--text-primary)` or `var(--accent-green)` over raw hex values in app code
- Only add project-local visual values when the design is intentionally project-specific
- Check `shared/README.md` before creating new shared styles so the layering stays consistent
- The landing page currently uses a minimal editorial pattern: one small uppercase title, no eyebrow, no subtitle, no footer copy
- Avoid border-heavy landing cards in the light theme; shadow-led cards read cleaner and remove unwanted vertical edge lines
- On the chart, always-visible district labels should stay desktop-only and remain hidden on narrow/mobile breakpoints

### Achromatic card style pattern (current design language)
- All UI cards: `background: #ffffff; border: 1px solid #000000` — no tokens, hardcoded for intentionality
- All text: `color: #000000` except green/orange accent values (indikatorwert, KpiCard value)
- This applies to: SectionCard, KpiCard, MetricPill, Tooltip — keep consistent across new components
- Slider: track + thumb in `#000000`, no glow/box-shadow

### Sidebar phase gate removal
- Sidebar visibility was gated on `phase >= 5` from intro hook — caused >3s load delay
- Fix: remove the opacity/pointer-events phase gate entirely; sidebar renders immediately
- Lesson: don't gate persistent UI panels on intro animation phases

### ChartControls overlay placement
- Fixed at `top: 50%; transform: translate(-50%, 64px)` to clear the large year label (font-size: dims.size * 0.07)
- If year label font size changes, adjust the Y offset accordingly
- Controls use `zIndex: 5`; tooltip uses `z-10` (Tailwind) — keep tooltip above controls

### Tooltip overlap prevention
- Gap-only approach fails when boundary clamping overrides quadrant placement
- Correct approach: after clamping, check if node point falls inside card rect; if so, flip to opposite quadrant
- `rightPad` prop on Tooltip accounts for sidebar width (296px) so right clamp doesn't push tooltip under sidebar
- Estimated card size (elW/elH) must match actual rendered size — update constants if card content changes

### SVG animations without d3.select
- CSS `@keyframes` + class names for breathing/pulse: requires `transform-box: fill-box; transform-origin: center` on SVG elements
- Particle flow: native SVG `<animateMotion>` along bezier path — no JS loop needed
- Stagger particles with `begin={delay + "s"}` offset
- **SVG SMIL cannot resolve CSS custom properties**: `<animate attributeName="fill" values="...;var(--token);...">` silently fails — always use literal hex values in SVG animation `values`

### Vercel deployment is manual (no auto-deploy)
- GitHub → Vercel auto-deploy is NOT connected; run `vercel --prod --yes` from `munich/` after any change
- Always rebuild the viz first: `cd binnenwanderungsziffer && npm run build`

### Stroke-dashoffset intro animation
- Must use `useRef` callback refs + `getTotalLength()` in a `useEffect` watching the phase
- Force reflow with `void el.getBoundingClientRect()` before setting final dashoffset

## Local Dev

### Port 8080 already in use
- Kill with: `kill $(lsof -ti:8080)` then restart `pnpm serve`
- Or use a different port: `python3 -m http.server 8081`

### Repo structure
- Git root: `munich/`  → GitHub: `hihuydo/munich-viz`
- Viz source: `munich/binnenwanderungsziffer/src/`
- Dev server: `cd binnenwanderungsziffer && pnpm dev`
- Deploy: `vercel --prod --yes` from `munich/`
- Shared design layer: `munich/shared/`
- Root landing page: `munich/index.html`

## Tailwind v4

- CSS variables use `@theme {}` block — not `@layer base { :root {} }`
- `@apply border-border` does NOT work without defining the color in `@theme`
- `noUncheckedSideEffectImports` must be `false` in tsconfig to allow `import './index.css'`
