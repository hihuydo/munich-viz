import { useRef, useEffect, useState } from 'react'
import { getDimensions, withPositions } from '@/lib/chartMath'
import type { BinnenwanderungRecord, ChartDimensions, NodeWithPosition } from '@/data/types'
import type { IntroPhase } from '@/hooks/useIntroAnimation'
import { useScales } from '@/hooks/useScales'
import { GlowDefs } from './GlowDefs'
import { BackgroundRings } from './BackgroundRings'
import { CenterLabel } from './CenterLabel'
import { CurveLayer } from './CurveLayer'
import { NodeRing } from './NodeRing'
import { ParticleLayer } from './ParticleLayer'
import { Tooltip } from './Tooltip'

interface Props {
  records: BinnenwanderungRecord[]
  globalMax: number
  jahr: number
  phase: IntroPhase
}

export function RadialChart({ records, globalMax, jahr, phase }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState<ChartDimensions | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [pinnedNode, setPinnedNode] = useState<string | null>(null)
  const [pulseNode, setPulseNode] = useState<string | null>(null)

  const { rScale, opScale, wScale } = useScales(globalMax)

  // Compute node positions
  const nodes: NodeWithPosition[] = dims ? withPositions(records, dims) : []

  // Determine pulse node on phase 4 (highest |indikatorwert| in current data)
  useEffect(() => {
    if (phase < 4 || nodes.length === 0) return
    const top = nodes.reduce((a, b) =>
      Math.abs(b.indikatorwert) > Math.abs(a.indikatorwert) ? b : a,
    )
    setPulseNode(top.raumbezug)
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // ResizeObserver
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0]!.contentRect
      setDims(getDimensions(width, height))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Reset pinned node when data changes
  useEffect(() => {
    setPinnedNode(null)
    setHoveredNode(null)
  }, [records])

  function handlePin(raumbezug: string) {
    setPinnedNode(prev => {
      if (prev === raumbezug) {
        setHoveredNode(null)
        return null
      }
      return raumbezug
    })
  }

  function handleBackgroundClick() {
    setPinnedNode(null)
    setHoveredNode(null)
  }

  const activeNodeName = pinnedNode ?? hoveredNode
  const activeNodeData = activeNodeName
    ? nodes.find(n => n.raumbezug === activeNodeName) ?? null
    : null

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      {dims && (
        <>
          <svg
            width={dims.width}
            height={dims.height}
            onClick={handleBackgroundClick}
            className="block"
          >
            <GlowDefs />
            <BackgroundRings dims={dims} phase={phase} />
            <CurveLayer
              nodes={nodes}
              dims={dims}
              globalMax={globalMax}
              opScale={opScale}
              wScale={wScale}
              phase={phase}
              hoveredNode={hoveredNode}
              pinnedNode={pinnedNode}
            />
            <NodeRing
              nodes={nodes}
              rScale={rScale}
              phase={phase}
              hoveredNode={hoveredNode}
              pinnedNode={pinnedNode}
              pulseNode={pulseNode}
              onHover={setHoveredNode}
              onPin={handlePin}
            />
            <ParticleLayer
              nodes={nodes}
              dims={dims}
              pinnedNode={pinnedNode}
            />
            <CenterLabel dims={dims} jahr={jahr} phase={phase} />
          </svg>

          {activeNodeData && (
            <Tooltip
              data={activeNodeData}
              containerWidth={dims.width}
              containerHeight={dims.height}
            />
          )}
        </>
      )}
    </div>
  )
}
