// data.js — JSON laden, parsen, filtern

/**
 * Lädt und parst die Binnenwanderungsdaten.
 * @returns {Promise<{records: object[], globalMax: number, years: number[]}>}
 *
 * globalMax: max |Indikatorwert| über ALLE Jahre und ALLE Auspragungen kombiniert.
 * Wird einmalig berechnet und bleibt fixiert — Knotengrößen bleiben beim
 * Jahres-/Kategorienwechsel auf derselben Skala (kein visuelles "Springen").
 * Erwarteter Bereich: ~90 (Ausreißer nichtdeutsch), typisch 20-30 (deutsch).
 */
export async function loadData(url) {
  const raw = await d3.json(url);

  // JSON hat records als Arrays; in Objekte umwandeln
  const records = raw.records
    .map(r => ({
      id:            r[0],
      auspragung:    r[2],   // "deutsch" | "nichtdeutsch" | "insgesamt"
      jahr:          +r[3],  // numerisch
      raumbezug:     r[4],   // z.B. "03 Maxvorstadt"
      indikatorwert: +r[5],  // normierte Rate pro 1.000 EW
      zugezogene:    r[6] === 'NA' ? null : +r[6],
      weggezogene:   r[7] === 'NA' ? null : +r[7],
      bevoelkerung:  r[8] === 'NA' ? null : +r[8],
    }))
    // Gesamtstädtischen Wert ausschließen (Saldo immer 0)
    .filter(r => r.raumbezug !== 'Stadt München');

  // globalMax über alle Jahre UND alle Auspragungen — bleibt fixiert
  const globalMax = d3.max(records, r => Math.abs(r.indikatorwert));

  // Verfügbare Jahre (aufsteigend sortiert, dynamisch aus Daten)
  const years = [...new Set(records.map(r => r.jahr))].sort((a, b) => a - b);

  return { records, globalMax, years };
}

/**
 * Filtert den Datensatz nach Jahr und Kategorie.
 * @returns {object[]} — 25 Bezirksdatensätze
 */
export function filterData(records, jahr, auspragung) {
  return records.filter(r => r.jahr === jahr && r.auspragung === auspragung);
}

/**
 * Gibt Top-5 Zuzug (höchste positive Werte) und Top-5 Wegzug (niedrigste negative Werte) zurück.
 *
 * Kein Overlap möglich: Zuzug-Liste enthält nur Einträge mit indikatorwert > 0,
 * Wegzug-Liste nur Einträge mit indikatorwert < 0. Ein Bezirk kann strukturell
 * nicht gleichzeitig Netto-Zuzug und Netto-Wegzug haben.
 *
 * @returns {{ top5zuzug: object[], top5wegzug: object[] }}
 */
export function getTop5(filteredRecords) {
  const sorted = [...filteredRecords].sort((a, b) => b.indikatorwert - a.indikatorwert);
  const top5zuzug  = sorted.filter(r => r.indikatorwert > 0).slice(0, 5);
  const top5wegzug = sorted.filter(r => r.indikatorwert < 0).slice(-5);

  // Overlap-Guard: sollte nie eintreten, aber explizit prüfen
  const zuzugNames  = new Set(top5zuzug.map(r => r.raumbezug));
  const wegzugNames = new Set(top5wegzug.map(r => r.raumbezug));
  const overlap = [...zuzugNames].filter(n => wegzugNames.has(n));
  console.assert(overlap.length === 0, 'Kein Overlap zwischen Top5 Zuzug und Wegzug erwartet', overlap);

  return { top5zuzug, top5wegzug };
}
