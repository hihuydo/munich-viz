// tooltip.js — Bezirksinformation als floating card neben dem Knoten

const el        = document.getElementById('tooltip');
const container = document.getElementById('viz-col');

const GAP    = 14; // Abstand Knoten ↔ Kartenrand
const MARGIN = 8;  // Mindestabstand zum Containerrand

/**
 * Zeigt die Bezirksinformation neben dem geklickten Knoten.
 * Platzierung erfolgt radial nach außen — die Karte öffnet in die
 * dem Ringmittelpunkt abgewandte Richtung (4-Quadranten-Logik).
 */
export function showTooltip(d, nodeX, nodeY) {
  const sign = d.indikatorwert > 0 ? '+' : '';
  const cls  = d.indikatorwert >= 0 ? 'positive' : 'negative';
  el.innerHTML = `
    <div class="tt-name">${d.raumbezug}</div>
    <div class="tt-value ${cls}">${sign}${d.indikatorwert.toFixed(1)}</div>
    <div class="tt-row"><span>ZUGEZOGENE</span><span>${d.zugezogene?.toLocaleString('de-DE') ?? '—'}</span></div>
    <div class="tt-row"><span>WEGGEZOGENE</span><span>${d.weggezogene?.toLocaleString('de-DE') ?? '—'}</span></div>
    <div class="tt-row"><span>PRO 1.000 EW</span><span>normiert</span></div>
  `;
  el.classList.remove('hidden');

  // Dimensionen lesen (synchron nach innerHTML-Set)
  const elW = el.offsetWidth;
  const elH = el.offsetHeight;
  const cw  = container.clientWidth;
  const ch  = container.clientHeight;

  // Ringmittelpunkt
  const cx = cw / 2;
  const cy = ch / 2;

  // Quadrant des Knotens relativ zum Zentrum bestimmt die Kartenecke,
  // die dem Zentrum am nächsten liegt — Karte öffnet nach außen.
  //
  //   dx >= 0, dy < 0  → Oben-rechts  → Karte rechts/oben vom Knoten
  //   dx >= 0, dy >= 0 → Unten-rechts → Karte rechts/unten vom Knoten
  //   dx < 0,  dy >= 0 → Unten-links  → Karte links/unten vom Knoten
  //   dx < 0,  dy < 0  → Oben-links   → Karte links/oben vom Knoten

  const dx = nodeX - cx;
  const dy = nodeY - cy;

  let left = dx >= 0 ? nodeX + GAP : nodeX - elW - GAP;
  let top  = dy >= 0 ? nodeY + GAP : nodeY - elH - GAP;

  // Containerrand-Klemmung (letztes Mittel)
  if (left < MARGIN)            left = MARGIN;
  if (left + elW > cw - MARGIN) left = cw - elW - MARGIN;
  if (top < MARGIN)             top  = MARGIN;
  if (top + elH > ch - MARGIN)  top  = ch - elH - MARGIN;

  el.style.left = `${left}px`;
  el.style.top  = `${top}px`;
}

export function hideTooltip() {
  el.classList.add('hidden');
}
