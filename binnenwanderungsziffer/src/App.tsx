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
        display: 'grid',
        gridTemplateColumns: isCompact ? '1fr' : 'minmax(0, 1fr) 320px',
        gridTemplateRows: isCompact ? 'minmax(52vh, 60vh) minmax(0, 1fr)' : '1fr',
        height: '100vh',
        width: '100vw',
        background:
          'radial-gradient(circle at top, rgba(var(--bg-ambient-rgb), 0.52), transparent 38%), var(--bg-primary)',
        overflow: 'hidden',
      }}
    >
      <RadialChart
        records={filtered}
        globalMax={globalMax}
        jahr={resolvedYear}
        phase={phase}
        hoveredNode={hoveredNode}
        pinnedNode={pinnedNode}
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
        phase={phase}
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
