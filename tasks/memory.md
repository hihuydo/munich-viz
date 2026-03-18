# Project Memory

## Current Structure

- Root landing page lives in `index.html`
- Shared visual system lives in `shared/`
- Main React/Vite app lives in `binnenwanderungsziffer/`
- Project notes live in `tasks/`

## Shared Design Layer

- Global design changes should start in `shared/tokens.css`
- `shared/style.css` is the stable import entry point for all projects
- `shared/base.css` controls the common typography and page defaults
- `shared/landing.css` controls the landing-page layout, spacing, and card styling
- `shared/README.md` documents how new projects should consume the shared layer

## Landing Page Decisions

- The landing page is intentionally minimal
- Header content is only `Datenvisualisierungen`
- The title uses the small uppercase meta style rather than a large hero headline
- There is no footer copy
- Cards use shadow instead of visible side borders
- Card grid width and spacing were tuned for larger German copy

## Binnenwanderungsziffer Decisions

- The app uses the shared token layer via `src/index.css`
- The UI is in German and should keep proper umlauts
- Large values represent `Saldo je 1.000 Einwohner`
- These values are normalized rates, not percentages and not absolute counts
- District numbers are hidden in displayed names; use the district name without numeric prefix in labels and headings
- District labels are visible next to circles on desktop only and hidden on narrow/mobile screens
- The browser-native SVG hover tooltip was removed by dropping the SVG `<title>` while keeping accessibility text

## Current Visual Direction

- Neutral light grey background without green tint
- Stronger green/orange accents for chart readability on light mode
- Larger sans-serif typography for readability across the landing page and app
- Sidebar metric summaries should use roomier rounded cards instead of tight pills when labels span multiple lines
