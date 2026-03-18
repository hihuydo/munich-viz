import type { CSSProperties } from 'react'
import type { IntroPhase } from '@/hooks/useIntroAnimation'

interface Props {
  years: number[]
  activeYear: number
  activeCategory: string
  phase: IntroPhase
  onYearChange: (year: number) => void
  onCategoryChange: (cat: string) => void
}

export function ChartControls({
  years,
  activeYear,
  activeCategory,
  phase,
  onYearChange,
  onCategoryChange,
}: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, 64px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
        zIndex: 5,
        opacity: phase >= 2 ? 1 : 0,
        transition: 'opacity 500ms ease 200ms',
        pointerEvents: phase >= 2 ? 'auto' : 'none',
        fontFamily: 'var(--font-serif)',
      }}
    >
      {/* Category toggle */}
      <div style={{ display: 'flex', gap: 6 }}>
        {(['deutsch', 'nichtdeutsch'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            aria-pressed={activeCategory === cat}
            style={toggleStyle(activeCategory === cat)}
          >
            {cat === 'deutsch' ? 'DEUTSCH' : 'NICHTDEUTSCH'}
          </button>
        ))}
      </div>

      {/* Year slider */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 240 }}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <span style={{ fontSize: 9, letterSpacing: 1.2, color: '#000000' }}>{years[0]}</span>
          <span style={{ fontSize: 9, letterSpacing: 1.2, color: '#000000' }}>{years[years.length - 1]}</span>
        </div>
      </div>
    </div>
  )
}

function toggleStyle(isActive: boolean): CSSProperties {
  return {
    background: isActive ? '#000000' : 'transparent',
    border: '1px solid #000000',
    color: isActive ? '#ffffff' : '#000000',
    fontSize: 9,
    letterSpacing: 1,
    padding: '5px 10px',
    cursor: 'pointer',
    borderRadius: 999,
    fontFamily: 'var(--font-serif)',
    transition: 'all 0.2s',
  }
}
