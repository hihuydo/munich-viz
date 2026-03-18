import { useState } from 'react'
import { useChartData } from '@/hooks/useChartData'
import { useIntroAnimation } from '@/hooks/useIntroAnimation'
import { RadialChart } from '@/components/RadialChart'
import { Sidebar } from '@/components/Sidebar'

export default function App() {
  const { years } = useChartData(2024, 'deutsch')
  const maxYear = years[years.length - 1] ?? 2024

  const [activeYear, setActiveYear] = useState(maxYear)
  const [activeCategory, setActiveCategory] = useState('deutsch')

  const { filtered, globalMax } = useChartData(activeYear, activeCategory)
  const phase = useIntroAnimation()

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 300px',
        height: '100vh',
        width: '100vw',
        background: '#080e1a',
        overflow: 'hidden',
      }}
    >
      <RadialChart
        records={filtered}
        globalMax={globalMax}
        jahr={activeYear}
        phase={phase}
      />
      <Sidebar
        years={years}
        activeYear={activeYear}
        activeCategory={activeCategory}
        records={filtered}
        phase={phase}
        onYearChange={setActiveYear}
        onCategoryChange={setActiveCategory}
      />
    </div>
  )
}
