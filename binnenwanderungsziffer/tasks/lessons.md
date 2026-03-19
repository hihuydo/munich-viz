# Lessons — Binnenwanderungsziffer München

## SVG SMIL animations don't support CSS custom properties

**Problem:** `<animate attributeName="fill" values="var(--color-positive-strong)" />` silently fails — SMIL resolves `fill` at parse time, before CSS variables are computed.

**Fix:** Use literal hex values in SMIL `values` attributes, not `var(--token)`.

**Applies to:** Any SVG `<animate>`, `<animateMotion>`, or `<set>` using `fill`, `stroke`, or other paint attributes.

---

## Vercel manual deploy required for static Vite projects

**Problem:** Auto-deploy via GitHub sometimes uses wrong framework detection.

**Fix:** Set `"framework": null` in `vercel.json` and define `buildCommand`, `outputDirectory`, `installCommand` explicitly. Manual re-deploy from Vercel dashboard if auto-deploy misbehaves.

---

## D3 for math, React for DOM

**Rule:** Never let D3 touch the DOM. Use D3 only for scales (`d3.scaleLinear`, `d3.scaleSqrt`), path generators, and math utilities. Let React render all SVG elements.

**Why:** Mixing D3 DOM manipulation with React causes reconciliation conflicts and unpredictable re-renders.
