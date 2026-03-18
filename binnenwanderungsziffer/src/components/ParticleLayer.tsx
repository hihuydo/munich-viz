import type { NodeWithPosition, ChartDimensions } from '@/data/types'
import { bezierPathReverse, getTop5 } from '@/lib/chartMath'

/**
 * Particles always flow orange → green (representing people moving
 * into the district with net inflow). Triggered only when a node is pinned.
 *
 * Green node pinned → show all orange partners flowing toward it.
 * Orange node pinned → show it flowing toward all green partners.
 */

const PARTICLES = 5      // particles per flow lane
const DURATION  = 2.2   // seconds per full traversal

interface FlowLane {
  key: string
  /** Path in the direction particles travel: orange → green */
  d: string
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
    // Green node pinned: particles arrive FROM each orange partner
    const pGreen = pinned
    for (const w of top5wegzug) {
      const pOrange = posMap.get(w.raumbezug)
      if (!pOrange) continue
      lanes.push({
        key: `${pinnedNode}←${w.raumbezug}`,
        // orange → green: use reverse of (green → orange)
        d: bezierPathReverse(pGreen, pOrange, dims),
      })
    }
  } else {
    // Orange node pinned: particles depart TO each green partner
    const pOrange = pinned
    for (const z of top5zuzug) {
      const pGreen = posMap.get(z.raumbezug)
      if (!pGreen) continue
      lanes.push({
        key: `${pinnedNode}→${z.raumbezug}`,
        // orange → green (natural direction)
        d: bezierPathReverse(pGreen, pOrange, dims),
      })
    }
  }

  return (
    <g className="particles" style={{ pointerEvents: 'none' }}>
      {lanes.map(lane =>
        Array.from({ length: PARTICLES }, (_, i) => {
          const delay = (i / PARTICLES) * DURATION
          return (
            <circle
              key={`${lane.key}-${i}`}
              r={2.5}
              fill="white"
              opacity={0}
            >
              {/* Fade in while moving, fade out near destination */}
              <animate
                attributeName="opacity"
                values="0;0.75;0.75;0"
                keyTimes="0;0.1;0.85;1"
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
