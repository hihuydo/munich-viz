import type { BinnenwanderungRecord } from '@/data/types'
import type { IntroPhase } from '@/hooks/useIntroAnimation'

interface Props {
  years: number[]
  activeYear: number
  activeCategory: string
  records: BinnenwanderungRecord[]
  phase: IntroPhase
  onYearChange: (year: number) => void
  onCategoryChange: (cat: string) => void
}

export function Sidebar({
  years, activeYear, activeCategory, records, phase,
  onYearChange, onCategoryChange,
}: Props) {
  const sorted = [...records].sort((a, b) => b.indikatorwert - a.indikatorwert)
  const maxRecord = sorted[0]
  const minRecord = sorted[sorted.length - 1]

  const visible = phase >= 5

  return (
    <aside
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '40px 28px',
        gap: 36,
        borderLeft: '1px solid #0e1e30',
        overflowY: 'auto',
        width: 300,
        flexShrink: 0,
        opacity: visible ? 1 : 0,
        transition: 'opacity 500ms ease',
        fontFamily: 'Georgia, serif',
        color: '#8aa0b8',
        background: '#080e1a',
      }}
    >
      {/* Title */}
      <div>
        <div style={{ fontSize: 11, letterSpacing: 4, color: '#8aa0b8' }}>
          BINNENWANDERUNG
        </div>
        <div style={{ fontSize: 9, letterSpacing: 2, color: '#4a6880', marginTop: 4 }}>
          MÜNCHEN · STADTBEZIRKE
        </div>
        <a
          href="../../index.html"
          style={{ fontSize: 8, letterSpacing: 2, color: '#2a4060', marginTop: 8, display: 'block', textDecoration: 'none' }}
        >
          ← MÜNCHEN
        </a>
      </div>

      {/* Category toggle */}
      <div style={{ display: 'flex', gap: 4 }}>
        {(['deutsch', 'nichtdeutsch'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            style={{
              flex: 1,
              background: activeCategory === cat ? '#4ade80' : '#0e1e30',
              border: `1px solid ${activeCategory === cat ? '#4ade80' : '#1a3050'}`,
              color: activeCategory === cat ? '#080e1a' : '#5a7898',
              fontSize: 8,
              letterSpacing: 2,
              padding: '6px 8px',
              cursor: 'pointer',
              borderRadius: 2,
              fontFamily: 'Georgia, serif',
              transition: 'all 0.2s',
            }}
          >
            {cat === 'deutsch' ? 'DEUTSCH' : 'AUSLÄNDISCH'}
          </button>
        ))}
      </div>

      {/* Year slider */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 8, letterSpacing: 2, color: '#4a6880' }}>JAHR</span>
          <span style={{ fontSize: 18, color: '#4ade80', fontFamily: 'Georgia, serif' }}>
            {activeYear}
          </span>
        </div>
        <input
          type="range"
          min={years[0]}
          max={years[years.length - 1]}
          value={activeYear}
          step={1}
          aria-label="Jahrauswahlschieber"
          onChange={e => onYearChange(Number(e.target.value))}
          style={{ width: '100%' }}
          className="viz-slider"
        />
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <span style={{ display: 'block', fontSize: 22, color: '#4ade80', fontFamily: 'Georgia, serif' }}>
            {maxRecord ? `+${maxRecord.indikatorwert.toFixed(1)}` : '—'}
          </span>
          <span style={{ display: 'block', fontSize: 8, letterSpacing: 2, color: '#4a6880', marginTop: 4 }}>
            MAX ZUZUG
          </span>
        </div>
        <div>
          <span style={{ display: 'block', fontSize: 22, color: '#fb923c', fontFamily: 'Georgia, serif' }}>
            {minRecord ? minRecord.indikatorwert.toFixed(1) : '—'}
          </span>
          <span style={{ display: 'block', fontSize: 8, letterSpacing: 2, color: '#4a6880', marginTop: 4 }}>
            MAX WEGZUG
          </span>
        </div>
      </div>
    </aside>
  )
}
