import type { NodeWithPosition } from '@/data/types'
import type { IntroPhase } from '@/hooks/useIntroAnimation'
import { nodeColor, getTop5 } from '@/lib/chartMath'

interface Props {
  nodes: NodeWithPosition[]
  rScale: (v: number) => number
  phase: IntroPhase
  hoveredNode: string | null
  pinnedNode: string | null
  pulseNode: string | null
  onHover: (raumbezug: string | null) => void
  onPin: (raumbezug: string) => void
}

export function NodeRing({
  nodes, rScale, phase, hoveredNode, pinnedNode,
  pulseNode, onHover, onPin,
}: Props) {
  const { top5zuzug, top5wegzug } = getTop5(nodes)
  const top5names = new Set([...top5zuzug, ...top5wegzug].map(d => d.raumbezug))

  const activeNode = pinnedNode ?? hoveredNode
  const isInteracting = activeNode !== null

  return (
    <g className="nodes">
      {nodes.map((d, i) => {
        const r = rScale(Math.abs(d.indikatorwert))
        const color = nodeColor(d.indikatorwert)
        const isActive = d.raumbezug === activeNode
        const isPulse = d.raumbezug === pulseNode && phase >= 4
        const isTop5 = top5names.has(d.raumbezug)

        let nodeOpacity: number
        if (phase < 2) {
          nodeOpacity = 0
        } else if (isInteracting) {
          nodeOpacity = isActive ? 1 : 0.15
        } else {
          nodeOpacity = 1
        }

        const displayR = isActive ? r * 1.25 : r
        const haloOpacity = isPulse ? 0.35 : (isTop5 ? 0.12 : 0)

        return (
          <g
            key={d.raumbezug}
            transform={`translate(${d.x},${d.y})`}
            style={{
              cursor: 'pointer',
              opacity: nodeOpacity,
              transition: `opacity 150ms ease ${phase < 2 ? i * 40 + 'ms' : '0ms'}`,
            }}
            onMouseEnter={() => {
              if (pinnedNode && pinnedNode !== d.raumbezug) return
              onHover(d.raumbezug)
            }}
            onMouseLeave={() => {
              if (pinnedNode) return
              onHover(null)
            }}
            onClick={e => {
              e.stopPropagation()
              onPin(d.raumbezug)
            }}
          >
            {/* Glow halo for top-5 */}
            <circle
              r={isTop5 ? r * 2.2 : 0}
              fill={color}
              opacity={haloOpacity}
              filter="url(#glow-soft)"
              style={{ transition: 'opacity 400ms ease' }}
            />
            {/* Main dot */}
            <circle
              r={displayR}
              fill={color}
              opacity={0.9}
              style={{ transition: 'r 500ms cubic-bezier(0.33,1,0.68,1)' }}
            />
          </g>
        )
      })}
    </g>
  )
}
