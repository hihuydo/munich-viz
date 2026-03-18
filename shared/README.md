# Shared Munich Design Layer

This folder is the design system for the **root `index.html` landing page** only.
Each visualization project manages its own design tokens and styles independently.

## Files

- `style.css`
  Entry point for the landing page — imports tokens + base reset.
- `tokens.css`
  Color tokens, typography, radius, and semantic aliases for the landing page.
- `base.css`
  Minimal CSS reset and base element styles.
- `landing.css`
  Layout and card styles for the root shell (`index.html`).

## Usage

### Root landing page only

```html
<link rel="stylesheet" href="./shared/style.css" />
<link rel="stylesheet" href="./shared/landing.css" />
```

## Project design system rule

Each project owns its design. **Do not import from `shared/` inside a sub-project.**

When adding a new visualization:

1. Create `munich/<slug>/` with its own build setup
2. Define design tokens directly in the project's own CSS (e.g. `src/index.css`)
3. Use the same accent color values (`#4ade80` green, `#fb923c` orange) for visual consistency
4. Add a card to `munich/index.html` using the `munich-card__*` classes

When you want a design change to affect **all Munich projects**, change `tokens.css`.
For per-project changes, edit only that project's own CSS.
