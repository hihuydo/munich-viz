// main.js — Orchestrierung

import { loadData, filterData } from './data.js';
import { initSVG, renderData, getDimensions } from './render.js';
import { playIntro } from './animate.js';
import { bindInteraction, resetPinnedNode } from './interaction.js';

async function init() {
  const { records, globalMax, years } = await loadData('data/binnenwanderung.json');

  const svgEl = document.getElementById('viz');
  let dims = getDimensions(svgEl);

  let activeYear = years[years.length - 1];
  let activeCategory = 'deutsch';

  // Slider initialisieren
  const slider = document.getElementById('year-slider');
  const yearLabel = document.getElementById('year-label');
  slider.min = years[0];
  slider.max = years[years.length - 1];
  slider.value = activeYear;
  yearLabel.textContent = activeYear;

  // Erster Render
  initSVG(svgEl, dims);
  let withPos = renderData(svgEl, filterData(records, activeYear, activeCategory), globalMax, dims, activeYear);
  updateKPIs(filterData(records, activeYear, activeCategory));
  playIntro(svgEl, withPos);

  // Interaktion nach Intro binden
  setTimeout(() => bindInteraction(d3.select(svgEl)), 3500);

  // ── Slider ────────────────────────────────────────────────
  // Debounce: verhindert dass schnelles Ziehen N bindInteraction-Timeouts aufstapelt
  let bindTimer = null;
  slider.addEventListener('input', () => {
    activeYear = +slider.value;
    yearLabel.textContent = activeYear;
    resetPinnedNode();
    const filtered = filterData(records, activeYear, activeCategory);
    withPos = renderData(svgEl, filtered, globalMax, dims, activeYear);
    updateKPIs(filtered);
    clearTimeout(bindTimer);
    bindTimer = setTimeout(() => bindInteraction(d3.select(svgEl)), 650);
  });

  // ── Toggle ────────────────────────────────────────────────
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.category;
      resetPinnedNode();
      const filtered = filterData(records, activeYear, activeCategory);
      // Guard: falls Kategorie keine Daten liefert (z.B. Unicode-Mismatch bei Umlauten)
      console.assert(filtered.length > 0,
        `Keine Daten für Kategorie "${activeCategory}" im Jahr ${activeYear}. Umlaut-Encoding prüfen.`);
      withPos = renderData(svgEl, filtered, globalMax, dims, activeYear);
      updateKPIs(filtered);
      clearTimeout(bindTimer);
      bindTimer = setTimeout(() => bindInteraction(d3.select(svgEl)), 650);
    });
  });

  // ── Resize ────────────────────────────────────────────────
  window.addEventListener('resize', () => {
    dims = getDimensions(svgEl);
    initSVG(svgEl, dims);
    withPos = renderData(svgEl, filterData(records, activeYear, activeCategory), globalMax, dims, activeYear);
    bindInteraction(d3.select(svgEl));
  });
}

function updateKPIs(filtered) {
  const sorted = [...filtered].sort((a, b) => b.indikatorwert - a.indikatorwert);
  const max = sorted[0];
  const min = sorted[sorted.length - 1];
  document.getElementById('kpi-max-val').textContent =
    max ? `+${max.indikatorwert.toFixed(1)}` : '—';
  document.getElementById('kpi-min-val').textContent =
    min ? min.indikatorwert.toFixed(1) : '—';
}

init();
