import { useState } from 'react'
import type { ReactNode } from 'react'
import type { BinnenwanderungRecord } from '@/data/types'

import { districtLabel, districtNumber, getContrastPairs } from '@/lib/chartMath'
import { TrendSparkline } from './TrendSparkline'

interface Props {
  activeYear: number
  activeCategory: string
  records: BinnenwanderungRecord[]
  allRecords: BinnenwanderungRecord[]
  activeNodeName: string | null
  activeNodeData: BinnenwanderungRecord | null
  isCompact: boolean
  onClearSelection: () => void
}

export function Sidebar({
  activeYear,
  activeCategory,
  records,
  allRecords,
  activeNodeName,
  activeNodeData,
  isCompact,
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

  return (
    <aside
      style={{
        position: 'fixed',
        ...(isCompact
          ? { left: 0, right: 0, bottom: 0, maxHeight: '52vh' }
          : { right: 16, top: 16, bottom: 16, width: 272 }),
        display: 'flex',
        flexDirection: 'column',
        padding: isCompact ? '14px 14px 20px' : '18px 14px',
        gap: 6,
        overflowY: 'auto',
        fontFamily: 'var(--font-serif)',
        color: 'var(--text-primary)',
        background: 'rgba(var(--bg-primary-rgb), 0.82)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',

        borderRadius: isCompact ? '12px 12px 0 0' : 4,
        zIndex: 10,
      }}
    >
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
