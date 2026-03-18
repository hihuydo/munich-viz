import type { NodeWithPosition } from '@/data/types'
import type { IntroPhase } from '@/hooks/useIntroAnimation'
import { districtLabel, nodeColor, getTop5 } from '@/lib/chartMath'

interface Props {
  nodes: NodeWithPosition[]
  rScale: (v: number) => number
  phase: IntroPhase
  hoveredNode: string | null
  pinnedNode: string | null
  pulseNode: string | null
  onHover: (raumbezug: string | null) => void
  onPin: (raumbezug: string | null) => void
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
        const isPinned = d.raumbezug === pinnedNode
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
        const labelOffset = displayR + 8
        const labelOnRight = Math.cos(d.angle) >= 0

        return (
          <g
            key={d.raumbezug}
            transform={`translate(${d.x},${d.y})`}
            tabIndex={0}
            role="button"
            aria-label={`${d.raumbezug}, Binnenwanderung ${d.indikatorwert.toFixed(1)} pro 1.000 Einwohner`}
            aria-pressed={isPinned}
            style={{
              cursor: 'pointer',
              opacity: nodeOpacity,
              transition: `opacity 150ms ease ${phase < 2 ? i * 40 + 'ms' : '0ms'}`,
              outline: 'none',
            }}
            onMouseEnter={() => {
              if (pinnedNode && pinnedNode !== d.raumbezug) return
              onHover(d.raumbezug)
            }}
            onFocus={() => onHover(d.raumbezug)}
            onMouseLeave={() => {
              if (pinnedNode) return
              onHover(null)
            }}
            onBlur={() => {
              if (pinnedNode) return
              onHover(null)
            }}
            onClick={e => {
              e.stopPropagation()
              onPin(d.raumbezug)
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onPin(d.raumbezug)
              }
              if (e.key === 'Escape') {
                e.preventDefault()
                onPin(null)
              }
            }}
          >
            {/* Expanding pulse ring — when hovered or pinned */}
            {isActive && (
              <circle
                r={displayR}
                fill={color}
                className="node-pulse-ring"
              />
            )}
            {/* Glow halo for top-5 */}
            <circle
              r={isTop5 ? r * 2.2 : 0}
              fill={color}
              opacity={haloOpacity}
              filter="url(#glow-soft)"
              style={{ transition: 'opacity 400ms ease' }}
            />
            {/* Main dot — breathes when hovered or pinned */}
            <circle
              r={displayR}
              fill={color}
              opacity={0.9}
              className={isActive ? 'node-breathe' : undefined}
              style={isActive ? undefined : { transition: 'r 500ms cubic-bezier(0.33,1,0.68,1)' }}
            />
            <text
              className="node-inline-label"
              x={labelOnRight ? labelOffset : -labelOffset}
              y={4}
              textAnchor={labelOnRight ? 'start' : 'end'}
              fill={isActive ? 'var(--text-contrast)' : 'var(--text-secondary)'}
              opacity={nodeOpacity}
              fontSize={isActive ? 10 : 8}
              letterSpacing={0.2}
              fontFamily="var(--font-serif)"
              style={{ pointerEvents: 'none', transition: 'opacity 150ms ease, fill 150ms ease' }}
            >
              {districtLabel(d.raumbezug)}
            </text>
          </g>
        )
      })}
    </g>
  )
}
