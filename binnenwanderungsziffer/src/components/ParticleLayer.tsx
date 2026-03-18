import type { NodeWithPosition, ChartDimensions } from '@/data/types'
import { bezierPathReverse, getTop5, nodeColor } from '@/lib/chartMath'

/**
 * Particles flow orange → green, color-morphing from source to destination:
 *   sourceColor → white (midpoint) → destColor
 *
 * Green node pinned → particles arrive FROM each orange partner.
 * Orange node pinned → particles depart TO each green partner.
 */

const PARTICLES = 5
const DURATION  = 2.2  // seconds per traversal

interface FlowLane {
  key: string
  d: string
  sourceColor: string
  destColor: string
}

interface Props {
  nodes: NodeWithPosition[]
  dims: ChartDimensions
  pinnedNode: string | null
}

export function ParticleLayer({ nodes, dims, pinnedNode }: Props) {
  if (!pinnedNode) return null

  const posMap = new Map(nodes.map(n => [n.raumbezug, n]))
  const pinned  = posMap.get(pinnedNode)
  if (!pinned) return null

  const { top5zuzug, top5wegzug } = getTop5(nodes)
  const lanes: FlowLane[] = []

  if (pinned.indikatorwert >= 0) {
    // Green node pinned: particles flow FROM each orange partner → green
    for (const w of top5wegzug) {
      const pOrange = posMap.get(w.raumbezug)
      if (!pOrange) continue
      lanes.push({
        key: `${pinnedNode}←${w.raumbezug}`,
        d: bezierPathReverse(pinned, pOrange, dims),
        sourceColor: nodeColor(w.indikatorwert),   // orange shade
        destColor:   nodeColor(pinned.indikatorwert), // green shade
      })
    }
  } else {
    // Orange node pinned: particles flow FROM orange → each green partner
    for (const z of top5zuzug) {
      const pGreen = posMap.get(z.raumbezug)
      if (!pGreen) continue
      lanes.push({
        key: `${pinnedNode}→${z.raumbezug}`,
        d: bezierPathReverse(pGreen, pinned, dims),
        sourceColor: nodeColor(pinned.indikatorwert), // orange shade
        destColor:   nodeColor(z.indikatorwert),      // green shade
      })
    }
  }

  return (
    <g className="particles" style={{ pointerEvents: 'none' }}>
      {lanes.map(lane =>
        Array.from({ length: PARTICLES }, (_, i) => {
          const delay = (i / PARTICLES) * DURATION
          // source → white midpoint → dest, synced with opacity fade
          const fillValues = `${lane.sourceColor};#ffffff;${lane.destColor}`
          return (
            <circle
              key={`${lane.key}-${i}`}
              r={2.5}
              fill={lane.sourceColor}
              opacity={0}
            >
              {/* opacity: fade in → hold → fade out */}
              <animate
                attributeName="opacity"
                values="0;0.85;0.85;0"
                keyTimes="0;0.1;0.85;1"
                dur={`${DURATION}s`}
                begin={`${delay}s`}
                repeatCount="indefinite"
              />
              {/* color: source → white → dest */}
              <animate
                attributeName="fill"
                values={fillValues}
                keyTimes="0;0.5;1"
                dur={`${DURATION}s`}
                begin={`${delay}s`}
                repeatCount="indefinite"
              />
              <animateMotion
                dur={`${DURATION}s`}
                begin={`${delay}s`}
                repeatCount="indefinite"
                calcMode="spline"
                keySplines="0.4 0 0.6 1"
                path={lane.d}
              />
            </circle>
          )
        })
      )}
    </g>
  )
}
