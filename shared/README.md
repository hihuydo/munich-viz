# Shared Munich Design Layer

This folder is the single source of truth for repo-wide visual design decisions in `munich/`.

## Files

- `style.css`
  Stable public entry point for shared tokens and base rules.
- `tokens.css`
  Global color, typography, radius, and semantic chart tokens.
- `base.css`
  Minimal reset and shared base element styles.
- `landing.css`
  Shared layout and card classes for the root `index.html` shell.

## Usage

### Root landing page

```html
<link rel="stylesheet" href="./shared/style.css" />
<link rel="stylesheet" href="./shared/landing.css" />
```

### Static project page inside a subfolder

```html
<link rel="stylesheet" href="../shared/style.css" />
```

### Vite / React project

```css
@import "../../shared/style.css";
```

Then reference the shared CSS variables via `var(--token-name)` in CSS or inline styles.

## Rule

When you want a design change to affect all Munich projects, change `tokens.css` first.
Only add project-specific styles outside this folder when the design should not be global.
