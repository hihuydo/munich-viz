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
- Repo-wide visual changes must start in `shared/tokens.css`, not inside a single project
- `shared/style.css` is the stable public entry point and imports `shared/tokens.css` + `shared/base.css`
- The root shell uses `shared/landing.css` for shared landing-page layout and card styles
- New static subprojects should import `../shared/style.css`
- New Vite/React projects should import `@import "../../shared/style.css";` from their app CSS
- `binnenwanderungsziffer/` is now the reference implementation for consuming shared tokens inside a React app
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

### SVG animations without d3.select
- CSS `@keyframes` + class names for breathing/pulse: requires `transform-box: fill-box; transform-origin: center` on SVG elements
- Particle flow: native SVG `<animateMotion>` along bezier path — no JS loop needed
- Stagger particles with `begin={delay + "s"}` offset

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
