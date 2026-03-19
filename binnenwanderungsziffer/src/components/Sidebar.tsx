import { useState } from 'react'
import type { ReactNode } from 'react'
import type { BinnenwanderungRecord } from '@/data/types'

import { districtLabel, districtNumber, getContrastPairs } from '@/lib/chartMath'
import { TrendSparkline } from './TrendSparkline'

interface Props {
  years: number[]
  activeYear: number
  activeCategory: string
  records: BinnenwanderungRecord[]
  allRecords: BinnenwanderungRecord[]
  activeNodeName: string | null
  activeNodeData: BinnenwanderungRecord | null
  isCompact: boolean
  onYearChange: (year: number) => void
  onCategoryChange: (cat: string) => void
  onClearSelection: () => void
  sheetState: 'peek' | 'controls' | 'full'
  onSheetStateChange: (state: 'peek' | 'controls' | 'full') => void
}

export function Sidebar({
  years,
  activeYear,
  activeCategory,
  records,
  allRecords,
  activeNodeName,
  activeNodeData,
  isCompact,
  onYearChange,
  onCategoryChange,
  onClearSelection,
  sheetState,
  onSheetStateChange,
}: Props) {
  const ranking = [...records].sort((a, b) =>
    b.indikatorwert - a.indikatorwert ||
    districtNumber(a.raumbezug) - districtNumber(b.raumbezug),
  )

  const strongestInflow = ranking.find(record => record.indikatorwert > 0) ?? ranking[0] ?? null
  const strongestOutflow = [...ranking].reverse().find(record => record.indikatorwert < 0) ?? ranking[ranking.length - 1] ?? null
  const positives = records.filter(record => record.indikatorwert > 0).length
  const negatives = records.filter(record => record.indikatorwert < 0).length
  const average = records.length
    ? records.reduce((sum, record) => sum + record.indikatorwert, 0) / records.length
    : 0

  const focusRecord = activeNodeData ?? strongestInflow ?? strongestOutflow
  const focusTrend = focusRecord
    ? allRecords
      .filter(record =>
        record.raumbezug === focusRecord.raumbezug &&
        record.auspragung === activeCategory,
      )
      .sort((a, b) => a.jahr - b.jahr)
    : []

  const previousPoint = focusTrend.length >= 2 ? focusTrend[focusTrend.length - 2] : null
  const currentPoint = focusTrend[focusTrend.length - 1] ?? null
  const delta = currentPoint && previousPoint
    ? currentPoint.indikatorwert - previousPoint.indikatorwert
    : null
  const trendAverage = focusTrend.length
    ? focusTrend.reduce((sum, record) => sum + record.indikatorwert, 0) / focusTrend.length
    : null
  const focusRank = focusRecord
    ? ranking.findIndex(record => record.raumbezug === focusRecord.raumbezug) + 1
    : null

  const contrastPairs = getContrastPairs(records, activeNodeName).slice(0, 4)

  const SHEET_CYCLE = { peek: 'controls', controls: 'full', full: 'peek' } as const

  function cycleSheet() {
    onSheetStateChange(SHEET_CYCLE[sheetState])
  }

  const snapHeight = { peek: '12vh', controls: '38vh', full: '72vh' }[sheetState]

  if (!isCompact) {
    return (
      <aside
        style={{
          position: 'fixed',
          right: 16,
          top: 16,
          bottom: 16,
          width: 272,
          display: 'flex',
          flexDirection: 'column',
          padding: '18px 14px',
          gap: 6,
          overflowY: 'auto',
          fontFamily: 'var(--font-serif)',
          color: 'var(--text-primary)',
          background: 'rgba(var(--bg-primary-rgb), 0.82)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderRadius: 4,
          zIndex: 10,
        }}
      >
        <SectionCard title="Jahr" defaultOpen={true}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Year slider */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input
                type="range"
                min={years[0]}
                max={years[years.length - 1]}
                value={activeYear}
                step={1}
                aria-label="Jahr auswählen"
                onChange={e => onYearChange(Number(e.target.value))}
                style={{ width: '100%' }}
                className="viz-slider"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 9, letterSpacing: 1.2, color: '#000000' }}>{years[0]}</span>
                <span style={{ fontSize: 9, letterSpacing: 1.2, color: '#000000' }}>{years[years.length - 1]}</span>
              </div>
            </div>
            {/* Category toggle */}
            <div style={{ display: 'flex', gap: 6 }}>
              {(['deutsch', 'nichtdeutsch'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => onCategoryChange(cat)}
                  aria-pressed={activeCategory === cat}
                  style={{
                    flex: 1,
                    background: activeCategory === cat ? '#000000' : 'transparent',
                    border: '1px solid #000000',
                    color: activeCategory === cat ? '#ffffff' : '#000000',
                    fontSize: 9,
                    letterSpacing: 1,
                    padding: '5px 6px',
                    cursor: 'pointer',
                    borderRadius: 999,
                    fontFamily: 'var(--font-serif)',
                    transition: 'all 0.2s',
                  }}
                >
                  {cat === 'deutsch' ? 'DEUTSCH' : 'NICHTDEUTSCH'}
                </button>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Legende">
          <LegendRow color="var(--accent-green)" description="Positiver Saldo" />
          <LegendRow color="var(--accent-orange)" description="Negativer Saldo" />
          <LegendRow color="var(--text-contrast)" description="Kontrast-Linien" shape="line" />
          <LegendRow color="var(--text-primary)" description="Größe = Intensität" shape="rings" />
        </SectionCard>

        <SectionCard title="Lagebild">
          <KpiGrid>
            <KpiCard
              label="Top Plus"
              value={strongestInflow ? formatValue(strongestInflow.indikatorwert) : '—'}
              accent="var(--accent-green)"
              detail={strongestInflow ? districtLabel(strongestInflow.raumbezug) : 'Keine positive Ausprägung'}
              note="Saldo je 1.000 Ew."
            />
            <KpiCard
              label="Top Minus"
              value={strongestOutflow ? formatValue(strongestOutflow.indikatorwert) : '—'}
              accent="var(--accent-orange)"
              detail={strongestOutflow ? districtLabel(strongestOutflow.raumbezug) : 'Keine negative Ausprägung'}
              note="Saldo je 1.000 Ew."
            />
            <KpiCard
              label="Im Plus"
              value={`${positives}/${records.length}`}
              accent="var(--text-contrast)"
              detail={`${negatives} Bezirke im Minus`}
              note="Anzahl Bezirke"
            />
            <KpiCard
              label="Durchschnitt"
              value={formatValue(average)}
              accent="var(--accent-blue)"
              detail="Saldo je 1.000 Ew."
              note="Normierter Kennwert"
            />
          </KpiGrid>
        </SectionCard>

        {focusRecord && (
          <SectionCard title={activeNodeName ? 'Bezirk im Fokus' : 'Spotlight'}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 16, color: '#000000', lineHeight: 1.4 }}>
                  {districtLabel(focusRecord.raumbezug)}
                </div>
                <div style={{ fontSize: 10, color: '#000000', letterSpacing: 1.6, marginTop: 5 }}>
                  RANG {focusRank ?? '—'} IM JAHR {activeYear}
                </div>
              </div>
              {activeNodeName && (
                <button
                  onClick={onClearSelection}
                  style={{
                    border: '1px solid #000000',
                    background: 'transparent',
                    color: '#000000',
                    fontSize: 10,
                    letterSpacing: 1,
                    padding: '6px 10px',
                    borderRadius: 999,
                    cursor: 'pointer',
                  }}
                >
                  LÖSEN
                </button>
              )}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: 6,
                marginTop: 8,
              }}
            >
              <MetricPill label="Aktuell" value={formatValue(focusRecord.indikatorwert)} />
              <MetricPill label="Zum Vorjahr" value={delta === null ? '—' : formatValue(delta)} />
              <MetricPill label="Langfr. Schnitt" value={trendAverage === null ? '—' : formatValue(trendAverage)} />
            </div>

            <div style={{ marginTop: 10 }}>
              <TrendSparkline values={focusTrend.map(point => point.indikatorwert)} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: '#000000', letterSpacing: 1.2 }}>
                <span>{focusTrend[0]?.jahr ?? activeYear}</span>
                <span>{focusTrend[focusTrend.length - 1]?.jahr ?? activeYear}</span>
              </div>
            </div>
          </SectionCard>
        )}

        <SectionCard title={activeNodeName ? 'Kontrastlinien' : 'Prägende Kontraste'} defaultOpen={false}>
          <div style={{ display: 'grid', gap: 2 }}>
            {contrastPairs.map(pair => (
              <div
                key={`${pair.positive.raumbezug}-${pair.negative.raumbezug}`}
                style={{
                  display: 'grid',
                  gap: 3,
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border-quiet)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
                  <span style={{ color: 'var(--accent-green)', fontSize: 12, lineHeight: 1.5 }}>
                    {districtLabel(pair.positive.raumbezug)}
                  </span>
                  <span style={{ color: 'var(--accent-orange)', fontSize: 12, lineHeight: 1.5, textAlign: 'right' }}>
                    {districtLabel(pair.negative.raumbezug)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 11 }}>
                  <span style={{ color: 'var(--accent-green)' }}>{formatValue(pair.positive.indikatorwert)}</span>
                  <span style={{ color: 'var(--accent-orange)' }}>{formatValue(pair.negative.indikatorwert)}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </aside>
    )
  }

  // Mobile bottom sheet
  return (
    <aside
      style={{
        maxHeight: snapHeight,
        transition: 'max-height 0.28s ease',
        overflowY: 'hidden',
        borderRadius: '12px 12px 0 0',
        borderTop: '2px solid #000000',
        background: '#ffffff',
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        fontFamily: 'var(--font-serif)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Handle button — stays pinned at top even when content scrolls */}
      <button
        onClick={cycleSheet}
        aria-label={sheetState === 'peek' ? 'Panel aufklappen' : sheetState === 'full' ? 'Panel einklappen' : 'Panel maximieren'}
        style={{
          width: '100%',
          minHeight: 44,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          background: '#ffffff',
          border: 'none',
          cursor: 'pointer',
          padding: '10px 16px 8px',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 1,
        }}
      >
        <div style={{ width: 32, height: 3, background: '#cccccc', borderRadius: 2 }} />
        {sheetState === 'peek' && (
          <div style={{ fontSize: 10, letterSpacing: 1.4, color: '#555555' }}>
            {activeYear} · {activeCategory === 'deutsch' ? 'DEUTSCH' : 'NICHTDEUTSCH'}
          </div>
        )}
        {/* State dots */}
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {(['peek', 'controls', 'full'] as const).map(s => (
            <div
              key={s}
              style={{
                width: s === sheetState ? 14 : 5,
                height: 5,
                borderRadius: 3,
                background: s === sheetState ? '#000000' : '#cccccc',
                transition: 'width 0.2s ease, background 0.2s ease',
              }}
            />
          ))}
        </div>
      </button>

      {/* Peek content */}
      {sheetState === 'peek' && (
        <div style={{ padding: '0 16px 14px', display: 'flex', justifyContent: 'center' }}>
          <a
            href="../../index.html"
            style={{ fontSize: 10, letterSpacing: 1.4, color: 'var(--text-muted)', textDecoration: 'none' }}
          >
            ← Alle Visualisierungen
          </a>
        </div>
      )}

      {/* Controls + Full content — scrollable inner wrapper with fade hint */}
      {(sheetState === 'controls' || sheetState === 'full') && (
        <div style={{
          overflowY: 'auto',
          flex: 1,
          minHeight: 0,
          WebkitMaskImage: 'linear-gradient(to bottom, black calc(100% - 40px), transparent 100%)',
          maskImage: 'linear-gradient(to bottom, black calc(100% - 40px), transparent 100%)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 12px 48px' }}>

            {/* District focus — shown at top when a node is selected */}
            {focusRecord && activeNodeName && (
              <div style={{ background: '#ffffff', border: '1px solid #000000', padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 15, color: '#000000', lineHeight: 1.4 }}>{districtLabel(focusRecord.raumbezug)}</div>
                    <div style={{ fontSize: 10, color: '#000000', letterSpacing: 1.4, marginTop: 3 }}>RANG {focusRank ?? '—'} · {activeYear}</div>
                  </div>
                  <button
                    onClick={onClearSelection}
                    style={{ border: '1px solid #000000', background: 'transparent', color: '#000000', fontSize: 10, letterSpacing: 1, padding: '6px 10px', borderRadius: 999, cursor: 'pointer', flexShrink: 0 }}
                  >
                    LÖSEN
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5, marginTop: 8 }}>
                  <MetricPill label="Aktuell" value={formatValue(focusRecord.indikatorwert)} />
                  <MetricPill label="Vorjahr" value={delta === null ? '—' : formatValue(delta)} />
                  <MetricPill label="Langfr." value={trendAverage === null ? '—' : formatValue(trendAverage)} />
                </div>
              </div>
            )}

            {/* Year slider */}
            <div style={{ background: '#ffffff', border: '1px solid #000000', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                type="range"
                min={years[0]}
                max={years[years.length - 1]}
                value={activeYear}
                step={1}
                aria-label="Jahr auswählen"
                onChange={e => onYearChange(Number(e.target.value))}
                style={{ width: '100%' }}
                className="viz-slider"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 9, letterSpacing: 1.2, color: '#000000' }}>{years[0]}</span>
                <span style={{ fontSize: 9, letterSpacing: 1.2, color: '#000000' }}>{years[years.length - 1]}</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['deutsch', 'nichtdeutsch'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => onCategoryChange(cat)}
                    aria-pressed={activeCategory === cat}
                    aria-label={cat === 'deutsch' ? 'Deutsch' : 'Nichtdeutsch'}
                    style={{
                      flex: 1,
                      background: activeCategory === cat ? '#000000' : 'transparent',
                      border: '1px solid #000000',
                      color: activeCategory === cat ? '#ffffff' : '#000000',
                      fontSize: 9,
                      letterSpacing: 1,
                      padding: '9px 10px',
                      cursor: 'pointer',
                      borderRadius: 999,
                      fontFamily: 'var(--font-serif)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {cat === 'deutsch' ? 'DEUTSCH' : 'NICHT-DEUTSCH'}
                  </button>
                ))}
              </div>
            </div>

            {/* KPI grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
              <KpiCard label="Top Plus" value={strongestInflow ? formatValue(strongestInflow.indikatorwert) : '—'} accent="var(--accent-green)" detail={strongestInflow ? districtLabel(strongestInflow.raumbezug) : '—'} note="Saldo je 1.000 Ew." />
              <KpiCard label="Top Minus" value={strongestOutflow ? formatValue(strongestOutflow.indikatorwert) : '—'} accent="var(--accent-orange)" detail={strongestOutflow ? districtLabel(strongestOutflow.raumbezug) : '—'} note="Saldo je 1.000 Ew." />
              <KpiCard label="Im Plus" value={`${positives}/${records.length}`} accent="var(--text-contrast)" detail={`${negatives} im Minus`} note="Bezirke" />
              <KpiCard label="Schnitt" value={formatValue(average)} accent="var(--accent-blue)" detail="Saldo je 1.000 Ew." note="Normiert" />
            </div>

            {/* Full-only: trend sparkline + contrasts */}
            {sheetState === 'full' && (
              <>
                {focusRecord && (
                  <div style={{ background: '#ffffff', border: '1px solid #000000', padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, letterSpacing: 1.2, color: '#000000', marginBottom: 6 }}>TREND · {districtLabel(focusRecord.raumbezug)}</div>
                    <TrendSparkline values={focusTrend.map(p => p.indikatorwert)} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: '#000000', letterSpacing: 1.2 }}>
                      <span>{focusTrend[0]?.jahr ?? activeYear}</span>
                      <span>{focusTrend[focusTrend.length - 1]?.jahr ?? activeYear}</span>
                    </div>
                  </div>
                )}

                <div style={{ background: '#ffffff', border: '1px solid #000000', padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, letterSpacing: 1.2, color: '#000000', marginBottom: 8 }}>KONTRASTE</div>
                  {contrastPairs.map(pair => (
                    <div key={`${pair.positive.raumbezug}-${pair.negative.raumbezug}`} style={{ display: 'grid', gap: 3, padding: '6px 0', borderBottom: '1px solid var(--border-quiet)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
                        <span style={{ color: 'var(--accent-green)', fontSize: 12 }}>{districtLabel(pair.positive.raumbezug)}</span>
                        <span style={{ color: 'var(--accent-orange)', fontSize: 12, textAlign: 'right' }}>{districtLabel(pair.negative.raumbezug)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 11 }}>
                        <span style={{ color: 'var(--accent-green)' }}>{formatValue(pair.positive.indikatorwert)}</span>
                        <span style={{ color: 'var(--accent-orange)' }}>{formatValue(pair.negative.indikatorwert)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}

function SectionCard({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <section style={{ background: '#ffffff', border: '1px solid #000000' }}>
      <button
        onClick={() => setIsOpen(v => !v)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          padding: '10px 14px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--font-serif)',
        }}
      >
        <span style={{ fontSize: 11, letterSpacing: 1.2, color: '#000000' }}>{title}</span>
        <span
          style={{
            fontSize: 10,
            color: '#000000',
            transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 0.2s ease',
            display: 'inline-block',
          }}
        >
          ▾
        </span>
      </button>
      {isOpen && (
        <div style={{ display: 'grid', gap: 10, padding: '0 14px 14px' }}>
          {children}
        </div>
      )}
    </section>
  )
}

function LegendRow({
  color,
  description,
  shape = 'dot',
}: {
  color: string
  description: string
  shape?: 'dot' | 'line' | 'rings'
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span aria-hidden="true" style={{ flexShrink: 0, width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {shape === 'dot' && (
          <svg width="8" height="8" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="4" fill={color} opacity={0.9} />
          </svg>
        )}
        {shape === 'line' && (
          <svg width="20" height="8" viewBox="0 0 20 8">
            <line x1="0" y1="4" x2="20" y2="4" stroke={color} strokeWidth="1.5" opacity={0.8} />
          </svg>
        )}
        {shape === 'rings' && (
          <svg width="20" height="8" viewBox="0 0 20 8">
            <circle cx="4" cy="4" r="2.5" fill={color} opacity={0.6} />
            <circle cx="14" cy="4" r="4" fill={color} opacity={0.9} />
          </svg>
        )}
      </span>
      <span style={{ color: '#000000', fontSize: 12, lineHeight: 1.4 }}>{description}</span>
    </div>
  )
}

function KpiGrid({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: 6,
      }}
    >
      {children}
    </div>
  )
}

function KpiCard({
  label,
  value,
  accent,
  detail,
  note,
}: {
  label: string
  value: string
  accent: string
  detail: string
  note: string
}) {
  return (
    <div
      style={{
        padding: '10px 12px 10px',
        background: '#ffffff',
        border: '1px solid #000000',
      }}
    >
      <div style={{ fontSize: 10, letterSpacing: 0.9, color: '#000000' }}>{label}</div>
      <div style={{ fontSize: 22, color: accent, marginTop: 6 }}>{value}</div>
      <div style={{ fontSize: 10, color: '#000000', lineHeight: 1.4, marginTop: 3 }}>{note}</div>
      <div style={{ fontSize: 11, color: '#000000', lineHeight: 1.5, marginTop: 4 }}>{detail}</div>
    </div>
  )
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'grid',
        gap: 3,
        alignContent: 'start',
        padding: '10px 12px',
        background: '#ffffff',
        border: '1px solid #000000',
      }}
    >
      <div style={{ fontSize: 10, letterSpacing: 0.8, color: '#000000', lineHeight: 1.35 }}>{label}</div>
      <div style={{ fontSize: 15, color: '#000000', lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 10, color: '#000000', lineHeight: 1.4 }}>
        je 1.000 Einwohner
      </div>
    </div>
  )
}


function formatValue(value: number) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}`
}
