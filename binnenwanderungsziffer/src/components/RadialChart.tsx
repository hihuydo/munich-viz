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
  hoveredNode: string | null
  pinnedNode: string | null
  sidebarWidth: number
  onHoverChange: (raumbezug: string | null) => void
  onPinChange: (raumbezug: string | null) => void
  reducedMotion: boolean
  isCompact: boolean
}

export function RadialChart({
  records,
  globalMax,
  jahr,
  phase,
  hoveredNode,
  pinnedNode,
  sidebarWidth,
  onHoverChange,
  onPinChange,
  reducedMotion,
  isCompact,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState<ChartDimensions | null>(null)
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
  }, [nodes, phase])

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

  function handlePin(raumbezug: string | null) {
    if (raumbezug === null) {
      onPinChange(null)
      onHoverChange(null)
      return
    }
    if (pinnedNode === raumbezug) {
      onPinChange(null)
      onHoverChange(null)
      return
    }
    onPinChange(raumbezug)
    onHoverChange(raumbezug)
  }

  function handleBackgroundClick() {
    onPinChange(null)
    onHoverChange(null)
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
            role="img"
            aria-label={`Radiale Binnenwanderungsvisualisierung für ${jahr}`}
          >
            <desc>
              Bezirke sind im Ring angeordnet. Grün steht für positive Binnenwanderung,
              Orange für negative. Linien zeigen Kontrastpaare mit starken Unterschieden.
            </desc>
            <GlowDefs />
            <BackgroundRings dims={dims} phase={phase} />
            <CurveLayer
              nodes={nodes}
              dims={dims}
              opScale={opScale}
              wScale={wScale}
              phase={phase}
              hoveredNode={hoveredNode}
              pinnedNode={pinnedNode}
              reducedMotion={reducedMotion}
            />
            <NodeRing
              nodes={nodes}
              rScale={rScale}
              phase={phase}
              hoveredNode={hoveredNode}
              pinnedNode={pinnedNode}
              pulseNode={pulseNode}
              onHover={onHoverChange}
              onPin={handlePin}
              isCompact={isCompact}
            />
            <ParticleLayer
              nodes={nodes}
              dims={dims}
              pinnedNode={hoveredNode ?? pinnedNode}
            />
            <CenterLabel dims={dims} jahr={jahr} phase={phase} />
          </svg>

          {!isCompact && activeNodeData && (
            <Tooltip
              data={activeNodeData}
              containerWidth={dims.width}
              containerHeight={dims.height}
              rightPad={sidebarWidth}
            />
          )}
        </>
      )}
    </div>
  )
}
