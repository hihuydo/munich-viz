# Gravitationsfeld — Binnenwanderungsziffer München

Interaktive Datenvisualisierung der Binnenwanderungsziffer der 25 Münchner Stadtbezirke.

Die App zeigt Netto-Wanderungssalden pro 1.000 Einwohner als radiale SVG-Visualisierung:

- Bezirke liegen als Knoten auf einem Ring
- Knotengröße codiert die absolute Stärke des Indikatorwerts
- Knotfarbe codiert positiven oder negativen Saldo
- Die Top-5 Zuzugs- und Top-5 Wegzugsbezirke werden über Bézier-Kurven verbunden
- Hover und Pin zeigen Details, Fokuszustände und Partikelflüsse

## Stack

- React 19
- Vite 6
- TypeScript
- Tailwind CSS v4
- D3 v7 nur für Berechnungen und Skalen
- SVG für das komplette Rendering

## Projektstruktur

```text
binnenwanderungsziffer/
├── data/
│   └── binnenwanderung.json
├── src/
│   ├── components/
│   ├── data/
│   ├── hooks/
│   ├── lib/
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── docs/
│   └── superpowers/
├── vite.config.ts
└── package.json
```

Hinweis: Die Ordner `js/` und `css/` enthalten ältere Vanilla-Prototypen und sind nicht die aktuelle Hauptimplementierung.

## Lokale Entwicklung

Im App-Ordner:

```bash
pnpm install
pnpm dev
```

Dann die von Vite ausgegebene URL im Browser öffnen.

## Build

```bash
pnpm build
```

Die gebauten Dateien landen in `dist/`.

Auf Repo-Ebene (`munich/`) gibt es zusätzlich einen delegierten Build-Befehl:

```bash
pnpm build
```

Dieser ruft intern den App-Build in `binnenwanderungsziffer/` auf.

## Shell-Projekt lokal starten

Auf Repo-Ebene (`munich/`) gibt es eine kleine Landing-Page, die diese Visualisierung einbettet bzw. verlinkt:

```bash
cd ..
pnpm serve
```

Danach `http://localhost:8080` öffnen.

## Deployment

Das Deployment ist auf das `munich/`-Root ausgelegt, nicht nur auf diese App.

- Root-Build: `cd binnenwanderungsziffer && npm install && npm run build`
- Output-Verzeichnis: `.`
- Produktion: [https://munich-xi.vercel.app](https://munich-xi.vercel.app)

Wichtig:

- `vite.config.ts` nutzt `base: './'`, damit die gebauten Assets auch in Unterverzeichnissen korrekt geladen werden
- Vercel verwendet hier `npm install`, weil `pnpm@10` in dieser Umgebung bereits Probleme verursacht hat

## Datenmodell

Quelle: `data/binnenwanderung.json`

Relevante Felder pro Datensatz:

- `auspragung`: `deutsch`, `nichtdeutsch`, `insgesamt`
- `jahr`
- `raumbezug`
- `indikatorwert`
- `zugezogene`
- `weggezogene`
- `bevoelkerung`

Beim Laden werden:

- Datensätze für `Stadt München` entfernt
- Jahre dynamisch aus den Daten gelesen
- ein globales Maximum für die Größen- und Kurvenskalierung berechnet

## Architektur

- [`src/hooks/useChartData.ts`](./src/hooks/useChartData.ts) parst und filtert die Rohdaten
- [`src/hooks/useIntroAnimation.ts`](./src/hooks/useIntroAnimation.ts) steuert die 5-stufige Intro-Sequenz
- [`src/lib/chartMath.ts`](./src/lib/chartMath.ts) enthält Layout-, Farb- und Pfadberechnung
- [`src/components/RadialChart.tsx`](./src/components/RadialChart.tsx) orchestriert das SVG, die Interaktion und die Tooltip-Logik
- [`src/components/Sidebar.tsx`](./src/components/Sidebar.tsx) enthält Kategorie- und Jahressteuerung

Grundsatz:

- D3 nur für Mathematik und Skalen
- React rendert sämtliche SVG-Elemente
- Keine DOM-Manipulation über `d3.select()`

## Interaktion

- Intro-Animation in Phasen: Hintergrund, Knoten, Kurven, Highlight, Sidebar
- Hover auf einen Bezirk dimmt irrelevante Knoten und Kurven
- Klick pinnt einen Bezirk, erneuter Klick oder Hintergrund hebt die Fixierung auf
- Tooltip zeigt Bezirksname, Indikatorwert sowie Zu- und Wegzüge
- Partikel visualisieren Flüsse zwischen dem aktiven Bezirk und seinen Gegenpolen

## Aktueller Status

Der React-Refactor ist abgeschlossen. Offene nächste Schritte liegen aktuell eher auf Repo-Ebene:

- Hover-Label direkt an den Knoten ergänzen
- Weitere München-Visualisierungen als neue Karten auf der Landing-Page hinzufügen
- Root-Build-/Serve-Workflow weiter glätten
