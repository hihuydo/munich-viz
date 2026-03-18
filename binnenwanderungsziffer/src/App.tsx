import { useEffect, useState, type ReactNode } from 'react'
import { useChartData } from '@/hooks/useChartData'
import { useIntroAnimation } from '@/hooks/useIntroAnimation'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { RadialChart } from '@/components/RadialChart'
import { Sidebar } from '@/components/Sidebar'

export default function App() {
  const [activeYear, setActiveYear] = useState<number | null>(null)
  const [activeCategory, setActiveCategory] = useState('deutsch')
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [pinnedNode, setPinnedNode] = useState<string | null>(null)

  const { filtered, allRecords, globalMax, years, isLoading, error } = useChartData(
    activeYear ?? 2024,
    activeCategory,
  )

  const phase = useIntroAnimation()
  const isCompact = useMediaQuery('(max-width: 1080px)')
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  useEffect(() => {
    if (years.length === 0 || activeYear !== null) return
    setActiveYear(years[years.length - 1] ?? 2024)
  }, [years, activeYear])

  useEffect(() => {
    setHoveredNode(null)
    setPinnedNode(null)
  }, [activeYear, activeCategory])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPinnedNode(null)
        setHoveredNode(null)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const resolvedYear = activeYear ?? years[years.length - 1] ?? 2024
  const activeNodeName = pinnedNode ?? hoveredNode
  const activeNodeData = activeNodeName
    ? filtered.find(record => record.raumbezug === activeNodeName) ?? null
    : null

  if (error) {
    return (
      <FullscreenMessage tone="warning">
        Daten konnten nicht geladen werden.
      </FullscreenMessage>
    )
  }

  if (isLoading || activeYear === null) {
    return (
      <FullscreenMessage>
        Lade Datenvisualisierung...
      </FullscreenMessage>
    )
  }

  return (
    <div
      style={{
        position: 'relative',
        height: '100vh',
        width: '100vw',
        background:
          'radial-gradient(circle at top, rgba(var(--bg-ambient-rgb), 0.52), transparent 38%), var(--bg-primary)',
        overflow: 'hidden',
      }}
    >
      {!isCompact && (
        <header
          style={{
            position: 'fixed',
            left: 24,
            top: 24,
            zIndex: 10,
            fontFamily: 'var(--font-serif)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div style={{ fontSize: 12, letterSpacing: 2.6, color: 'var(--text-primary)' }}>
            BINNENWANDERUNG
          </div>
          <div style={{ fontSize: 11, letterSpacing: 1.2, color: 'var(--text-secondary)' }}>
            MÜNCHEN · STADTBEZIRKE
          </div>
          <a
            href="../../index.html"
            style={{
              fontSize: 9,
              letterSpacing: 1.4,
              color: 'var(--text-muted)',
              marginTop: 6,
              display: 'inline-block',
              textDecoration: 'none',
            }}
          >
            ← Alle Visualisierungen
          </a>
        </header>
      )}

      <RadialChart
        records={filtered}
        globalMax={globalMax}
        jahr={resolvedYear}
        phase={phase}
        hoveredNode={hoveredNode}
        pinnedNode={pinnedNode}
        sidebarWidth={isCompact ? 0 : 296}
        onHoverChange={setHoveredNode}
        onPinChange={setPinnedNode}
        reducedMotion={reducedMotion}
      />
      <Sidebar
        years={years}
        activeYear={resolvedYear}
        activeCategory={activeCategory}
        records={filtered}
        allRecords={allRecords}
        activeNodeName={activeNodeName}
        activeNodeData={activeNodeData}
        isCompact={isCompact}
        onYearChange={setActiveYear}
        onCategoryChange={setActiveCategory}
        onClearSelection={() => {
          setPinnedNode(null)
          setHoveredNode(null)
        }}
      />
    </div>
  )
}

function FullscreenMessage({
  children,
  tone = 'default',
}: {
  children: ReactNode
  tone?: 'default' | 'warning'
}) {
  return (
    <div
      style={{
        display: 'grid',
        placeItems: 'center',
        minHeight: '100vh',
        width: '100vw',
        background: 'var(--bg-primary)',
        color: tone === 'warning' ? 'var(--accent-orange)' : 'var(--text-primary)',
        fontFamily: 'var(--font-serif)',
        letterSpacing: 1,
      }}
    >
      {children}
    </div>
  )
}
