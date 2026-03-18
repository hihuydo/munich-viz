# Gravitationsfeld — Binnenwanderung München

**Datum:** 2026-03-17
**Status:** Freigegeben
**Stack:** Vanilla JS + D3.js
**Zielgruppe:** Bürger:innen der Stadt München

---

## Überblick

Interaktive Visualisierung der Binnenwanderungsziffer der Stadt München. Die 25 Stadtbezirke werden als leuchtende Knoten auf einem Kreisring dargestellt. Bézier-Kurven verbinden die stärksten Zuzug- mit den stärksten Wegzug-Bezirken. Eine Intro-Animation führt die Nutzer:innen in die Daten ein, danach ist die Visualisierung vollständig interaktiv.

---

## Datenbasis

- **Quelle:** `13660905-e6ed-404b-99c2-894712373d28.json` (lokal, Pfad: `data/`)
- **Späterer Wechsel:** Stadtdaten-API München — nur Austausch der URL in `d3.json()`

### JSON-Struktur

```json
{
  "fields": [...],
  "records": [
    [id, "Binnenwanderungsziffer", auspragung, jahr, raumbezug, indikatorwert,
     basiswert1, basiswert2, basiswert3, "NA", "NA",
     "innerstädtisch Zugezogene", "innerstädtisch Weggezogene",
     "mittlere Hauptwohnsitzbevölkerung", "NA", "NA"]
  ]
}
```

### Felder (nach Index)

| Index | Feldname | Verwendung |
|---|---|---|
| 0 | `_id` | ignoriert |
| 1 | `Indikator` | immer `"Binnenwanderungsziffer"`, ignoriert |
| 2 | `Auspragung` | Filter: `"deutsch"` / `"ausländisch"` |
| 3 | `Jahr` | Slider-Wert (numerisch) |
| 4 | `Raumbezug` | Bezirksname inkl. Nummer (z.B. `"03 Maxvorstadt"`) |
| 5 | `Indikatorwert` | Hauptwert: normierte Rate pro 1.000 EW |
| 6 | `Basiswert.1` | Absolute Zugezogene — nur im Tooltip anzeigen |
| 7 | `Basiswert.2` | Absolute Weggezogene — nur im Tooltip anzeigen |
| 8 | `Basiswert.3` | Mittlere Hauptwohnsitzbevölkerung — nur im Tooltip |

### Filterregeln

- Zeilen mit `Raumbezug === "Stadt München"` werden **ausgeschlossen** (Gesamtsaldo immer 0)
- Aktiver Filter zur Laufzeit: `Jahr` (Slider) + `Auspragung` (Toggle)

### Bekannter Jahresbereich

- Sichtbar in den Daten: **2022–2024** (mind.)
- Der tatsächliche Bereich wird beim Laden aus der Datei gelesen (`d3.extent`)
- Slider-Domain = dynamisch aus Daten

### Standardzustand nach Intro

- Jahr: höchstes verfügbares Jahr (z.B. 2024)
- Kategorie: `"deutsch"`
- Keine Vorauswahl eines Bezirks

---

## Visuelle Sprache

### Layout

- Einzelnes SVG füllt den Viewport (responsive, quadratisch via `viewBox`)
- 25 Bezirksknoten gleichmäßig auf äußerem Ring (r ≈ 80% des halben SVG-Breite) verteilt
- Winkel je Bezirk: `(index / 25) * 2π`, Startpunkt oben (−π/2)
- Zentrum leer — symbolisiert Gesamtsaldo = 0; Label zeigt aktives Jahr

### Farben

| Bedeutung | Primär | Sekundär (mittel) | Gedämpft (inaktiv) |
|---|---|---|---|
| Zuzug | `#4ade80` | `#86efac` | `#166534` |
| Wegzug | `#fb923c` | `#fdba74` | `#7c2d12` |
| Hintergrund | `#080e1a` | — | — |
| Hintergrundstruktur | `#0e1e30` | — | — |
| Zentrums-Label | `#8aa0b8` | — | — |

Farbzuweisung per Knoten: `Indikatorwert > 0` → Grün-Palette, `Indikatorwert < 0` → Orange-Palette, `= 0` → neutral (`#3a5070`).

### Knotengrößen

- Radius = `d3.scaleSqrt().domain([0, globalMax]).range([3, 14])`
- `globalMax` = maximaler `|Indikatorwert|` **über alle Jahre und Kategorien** kombiniert (wird einmalig beim Laden berechnet, bleibt fixiert)
- Stabiler Maßstab: Knoten ändern ihre Größe beim Jahres-/Kategoriewechsel, aber die Skalierung bleibt konsistent — kein "Springen" des Größensystems

### Verbindungskurven

- Verbunden werden: **Top-5 Zuzug ↔ Top-5 Wegzug** des aktiven Filters (Jahr + Kategorie)
- Selektion: 5 höchste positive Werte + 5 niedrigste negative Werte aus gefiltertem Datensatz
- **Selektion:** Top-5 = 5 Knoten mit höchstem positivem Indikatorwert (Zuzug-Liste), 5 Knoten mit niedrigstem negativem Wert (Wegzug-Liste). Da ein Knoten nur dann in der Zuzug-Liste ist, wenn `Indikatorwert > 0`, und nur in der Wegzug-Liste wenn `Indikatorwert < 0`, kann ein Knoten **nicht** in beiden Listen gleichzeitig erscheinen.
- **Verbindungslogik:** Jeder der 5 Zuzug-Knoten wird mit jedem der 5 Wegzug-Knoten verbunden → exakt 25 Kurven (sofern beide Listen vollständig besetzt).
- **Knotenfarbe:** immer aus dem Netto-Indikatorwert des Knotens (`> 0` → Grün, `< 0` → Orange). Unabhängig von Kurven.
- **Kurvenfarbe:** einheitlich `rgba(255, 255, 255, variabel)` — neutrales Weiß. Vermeidet Farbkonflikt zwischen Zuzug- und Wegzug-Endpunkten.
- **Kurvenopazität:** `d3.scaleLinear().domain([0, globalMax * 2]).range([0.12, 0.55])`, Input = `|wertZuzug| + |wertWegzug|`
- **Kurvenbreite:** `d3.scaleLinear().domain([0, globalMax * 2]).range([0.6, 2.2])`, gleicher Input
- **Bézier-Kontrollpunkt:** Zentrum des SVG (`cx, cy`)

---

## Animationsablauf (Intro, ~3.5s)

| Phase | Zeitfenster | Beschreibung |
|---|---|---|
| Ring + Struktur | 0 – 0.5s | Kreisringe und Hintergrundgitter faden ein |
| Bezirksknoten | 0.5 – 1.5s | 25 Knoten materialisieren staggered (40ms Versatz je Knoten) |
| Kurven | 1.5 – 2.5s | Bézier-Kurven zeichnen sich ein via `stroke-dashoffset` |
| Highlight-Puls | 2.5 – 3.0s | Knoten mit höchstem `|Indikatorwert|` im Standardzustand pulsiert (datengetrieben, nicht hardcoded) |
| Controls | 3.0 – 3.5s | Slider, Toggle und Labels einblenden |

---

## Interaktionsmodell

### Hover (Bezirksknoten)

- Knoten leuchtet auf: Radius ×1.25, Glow-Intensität ×2
- Verbindungskurven dieses Knotens → volle Opazität
- Alle anderen Knoten + Kurven → 15% Opazität
- Tooltip erscheint (fixe Position: oben rechts im SVG-Container):
  - Bezirksname
  - Indikatorwert (z.B. `+28.5` oder `−11.4`)
  - Zugezogene (Basiswert.1, absolut)
  - Weggezogene (Basiswert.2, absolut)

### Klick

- Fixiert den Hover-Zustand; weiterer Klick auf denselben Knoten oder auf den Hintergrund löst ihn

### Jahresslider

- D3-Tween, 500ms, `d3.easeCubicInOut`
- Knoten: Radius + Farbe animieren zum neuen Jahreswert
- Kurven: neu berechnet, alte faden aus, neue faden ein
- Zentrumslabel wechselt sofort

### Kategorie-Toggle

- Zwei Buttons: `DEUTSCH` / `AUSLÄNDISCH`
- Beim Wechsel: Datensatz wird neu gefiltert, Visualisierung re-rendert mit demselben Tween wie Jahreswechsel
- Kein "gesamt"-Tab im MVP

---

## Technische Architektur

```
index.html              — Markup, Controls (Slider, Toggle, Tooltip-Container)
css/
  style.css             — Layout, Typografie, Controls, Tooltip
js/
  data.js               — JSON laden (d3.json), parsen, filtern, globalMax berechnen
  scales.js             — d3.scaleSqrt (Radius), d3.scaleSequential (Farbe), Winkelberechnung
  render.js             — SVG aufbauen: Hintergrundstruktur, Knoten (circle), Kurven (path)
  animate.js            — Intro-Sequenz (setTimeout + D3 Transitions)
  interaction.js        — Hover, Klick, Tooltip-Logik
  main.js               — Init, Slider/Toggle Event-Listener, Re-render-Orchestrierung
data/
  13660905-*.json       — Rohdaten (Symlink oder Kopie)
```

---

## Nicht im Scope (MVP)

- Mobile-Optimierung (Desktop-first, responsiv ab 800px)
- Server-Side Rendering
- Backend / Datenbank
- Mehrsprachigkeit (nur Deutsch)
- Export-Funktion (PNG/SVG)
- Kategorie "gesamt" (wird erst nach MVP evaluiert)
- Tooltip dynamisch am Cursor (fixe Position reicht für MVP)
