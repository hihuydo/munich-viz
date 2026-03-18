import type { CSSProperties, ReactNode } from 'react'
import type { BinnenwanderungRecord } from '@/data/types'
import type { IntroPhase } from '@/hooks/useIntroAnimation'
import { districtLabel, districtNumber, getContrastPairs } from '@/lib/chartMath'
import { TrendSparkline } from './TrendSparkline'

interface Props {
  years: number[]
  activeYear: number
  activeCategory: string
  records: BinnenwanderungRecord[]
  allRecords: BinnenwanderungRecord[]
  phase: IntroPhase
  activeNodeName: string | null
  activeNodeData: BinnenwanderungRecord | null
  isCompact: boolean
  onYearChange: (year: number) => void
  onCategoryChange: (cat: string) => void
  onClearSelection: () => void
}

export function Sidebar({
  years,
  activeYear,
  activeCategory,
  records,
  allRecords,
  phase,
  activeNodeName,
  activeNodeData,
  isCompact,
  onYearChange,
  onCategoryChange,
  onClearSelection,
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
  const visible = phase >= 5

  return (
    <aside
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: isCompact ? '22px 16px 28px' : '34px 22px',
        gap: 14,
        borderLeft: isCompact ? 'none' : '1px solid var(--border-muted)',
        borderTop: isCompact ? '1px solid var(--border-muted)' : 'none',
        overflowY: 'auto',
        width: isCompact ? '100%' : 344,
        flexShrink: 0,
        opacity: visible ? 1 : 0,
        transition: 'opacity 500ms ease',
        fontFamily: 'var(--font-serif)',
        color: 'var(--text-primary)',
        background:
          'linear-gradient(180deg, rgba(var(--bg-primary-rgb), 0.94), rgba(var(--bg-primary-rgb), 0.98))',
      }}
    >
      <div>
        <div style={{ fontSize: 13, letterSpacing: 2.6, color: 'var(--text-primary)' }}>
          BINNENWANDERUNG
        </div>
        <div style={{ fontSize: 12, letterSpacing: 1.2, color: 'var(--text-secondary)', marginTop: 4 }}>
          MÜNCHEN · STADTBEZIRKE
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--text-soft)', marginTop: 12, maxWidth: 260 }}>
          Sortiert nach aktuellem Saldo:
          starke Gewinne oben, starke Verluste im weiteren Kreisverlauf.
        </div>
        <a
          href="../../index.html"
          style={{
            fontSize: 9,
            letterSpacing: 1.4,
            color: 'var(--text-muted)',
            marginTop: 12,
            display: 'inline-block',
            textDecoration: 'none',
          }}
        >
          ← MÜNCHEN
        </a>
      </div>

      <SectionCard title="Legende">
        <LegendRow color="var(--accent-green)" label="Grün" description="Bezirke mit positivem Saldo" />
        <LegendRow color="var(--accent-orange)" label="Orange" description="Bezirke mit negativem Saldo" />
        <LegendRow color="var(--text-contrast)" label="Linien" description="markante Kontraste zwischen Plus und Minus" />
        <LegendRow color="var(--text-primary)" label="Größe" description="Intensität des Saldos je 1.000 Ew." />
      </SectionCard>

      <SectionCard title="Steuerung">
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {(['deutsch', 'nichtdeutsch'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              aria-pressed={activeCategory === cat}
              style={toggleButtonStyle(activeCategory === cat)}
            >
              {cat === 'deutsch' ? 'DEUTSCH' : 'NICHTDEUTSCH'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 12, letterSpacing: 1.4, color: 'var(--text-secondary)' }}>JAHR</span>
          <span style={{ fontSize: 24, color: 'var(--text-strong)' }}>{activeYear}</span>
        </div>
        <input
          type="range"
          min={years[0]}
          max={years[years.length - 1]}
          value={activeYear}
          step={1}
          aria-label="Jahr auswählen"
          onChange={event => onYearChange(Number(event.target.value))}
          style={{ width: '100%', marginTop: 10 }}
          className="viz-slider"
        />
      </SectionCard>

      <SectionCard title="Lagebild">
        <div
          style={{
            fontSize: 13,
            lineHeight: 1.6,
            color: 'var(--text-soft)',
            marginTop: -2,
          }}
        >
          Große Werte zeigen den <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Saldo je 1.000 Einwohner</strong>.
          Das ist ein normierter Kennwert, keine Prozentzahl und keine absolute Personenzahl.
        </div>
        <KpiGrid>
          <KpiCard
            label="Top Plus"
            value={strongestInflow ? formatValue(strongestInflow.indikatorwert) : '—'}
            accent="var(--accent-green)"
            detail={strongestInflow ? districtLabel(strongestInflow.raumbezug) : 'Keine positive Ausprägung'}
            note="Saldo je 1.000 Einwohner"
          />
          <KpiCard
            label="Top Minus"
            value={strongestOutflow ? formatValue(strongestOutflow.indikatorwert) : '—'}
            accent="var(--accent-orange)"
            detail={strongestOutflow ? districtLabel(strongestOutflow.raumbezug) : 'Keine negative Ausprägung'}
            note="Saldo je 1.000 Einwohner"
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
            detail="Saldo je 1.000 Einwohner"
            note="Normierter Kennwert"
          />
        </KpiGrid>
      </SectionCard>

      {focusRecord && (
        <SectionCard title={activeNodeName ? 'Bezirk im Fokus' : 'Spotlight'}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 19, color: 'var(--text-strong)', lineHeight: 1.4 }}>
                {districtLabel(focusRecord.raumbezug)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: 1.6, marginTop: 7 }}>
                RANG {focusRank ?? '—'} IM JAHR {activeYear}
              </div>
            </div>
            {activeNodeName && (
              <button
                onClick={onClearSelection}
                style={{
                  border: '1px solid var(--border-base)',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: 10,
                  letterSpacing: 1,
                  padding: '8px 11px',
                  borderRadius: 999,
                  cursor: 'pointer',
                }}
              >
                AUSWAHL LÖSEN
              </button>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(132px, 1fr))',
              gap: 10,
              marginTop: 14,
            }}
          >
            <MetricPill label="Aktuell" value={formatValue(focusRecord.indikatorwert)} />
            <MetricPill label="Zum Vorjahr" value={delta === null ? '—' : formatValue(delta)} />
            <MetricPill label="Langfristiger Schnitt" value={trendAverage === null ? '—' : formatValue(trendAverage)} />
          </div>

          <div style={{ marginTop: 14 }}>
            <TrendSparkline values={focusTrend.map(point => point.indikatorwert)} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11, color: 'var(--text-faint)', letterSpacing: 1.2 }}>
              <span>{focusTrend[0]?.jahr ?? years[0]}</span>
              <span>{focusTrend[focusTrend.length - 1]?.jahr ?? activeYear}</span>
            </div>
          </div>
        </SectionCard>
      )}

      <SectionCard title={activeNodeName ? 'Kontrastlinien' : 'Prägende Kontraste'}>
        <div style={{ display: 'grid', gap: 2 }}>
          {contrastPairs.map(pair => (
            <div
              key={`${pair.positive.raumbezug}-${pair.negative.raumbezug}`}
              style={{
                display: 'grid',
                gap: 4,
                padding: '10px 0',
                borderBottom: '1px solid var(--border-quiet)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
                <span style={{ color: 'var(--accent-green)', fontSize: 13, lineHeight: 1.5 }}>
                  {districtLabel(pair.positive.raumbezug)}
                </span>
                <span style={{ color: 'var(--accent-orange)', fontSize: 13, lineHeight: 1.5, textAlign: 'right' }}>
                  {districtLabel(pair.negative.raumbezug)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12 }}>
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

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section
      style={{
        display: 'grid',
        gap: 14,
        padding: '16px 18px 18px',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-soft)',
        background: 'linear-gradient(180deg, rgba(var(--bg-card-rgb), 0.96), rgba(var(--bg-primary-rgb), 0.96))',
        boxShadow: '0 14px 32px var(--color-shadow-card)',
      }}
    >
      <div style={{ fontSize: 12, letterSpacing: 1.2, color: 'var(--text-faint)' }}>{title}</div>
      {children}
    </section>
  )
}

function LegendRow({
  color,
  label,
  description,
}: {
  color: string
  label: string
  description: string
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'auto auto 1fr', gap: 10, alignItems: 'center' }}>
      <span
        aria-hidden="true"
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          background: color,
          boxShadow: `0 0 16px ${color}55`,
        }}
      />
      <span style={{ color: 'var(--text-contrast)', fontSize: 14 }}>{label}</span>
      <span style={{ color: 'var(--text-soft)', fontSize: 13, lineHeight: 1.58 }}>{description}</span>
    </div>
  )
}

function KpiGrid({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 10,
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
        padding: '14px 14px 12px',
        borderRadius: 'var(--radius-lg)',
        background: 'rgba(var(--bg-card-rgb), 0.9)',
        border: '1px solid var(--border-quiet)',
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: 0.9, color: 'var(--text-faint)' }}>{label}</div>
      <div style={{ fontSize: 26, color: accent, marginTop: 8 }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: 4 }}>{note}</div>
      <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.55, marginTop: 6 }}>{detail}</div>
    </div>
  )
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'grid',
        gap: 4,
        alignContent: 'start',
        minHeight: 96,
        padding: '12px 14px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-strong)',
        background: 'rgba(var(--bg-card-rgb), 0.75)',
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: 0.8, color: 'var(--text-faint)', lineHeight: 1.35 }}>{label}</div>
      <div style={{ fontSize: 17, color: 'var(--text-strong)', lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
        je 1.000 Einwohner
      </div>
    </div>
  )
}

function toggleButtonStyle(isActive: boolean): CSSProperties {
  return {
    flex: 1,
    background: isActive ? 'var(--accent-green)' : 'var(--bg-subtle)',
    border: `1px solid ${isActive ? 'var(--accent-green)' : 'var(--border-base)'}`,
    color: isActive ? 'var(--text-inverse)' : 'var(--text-faint)',
    fontSize: 11,
    letterSpacing: 0.5,
    padding: '10px 11px',
    cursor: 'pointer',
    borderRadius: 999,
    fontFamily: 'var(--font-serif)',
    transition: 'all 0.2s',
  }
}

function formatValue(value: number) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}`
}
