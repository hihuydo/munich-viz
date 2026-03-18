import { useEffect, useRef } from 'react'
import type { NodeWithPosition, ChartDimensions } from '@/data/types'
import type { IntroPhase } from '@/hooks/useIntroAnimation'
import { bezierPath, getContrastPairs } from '@/lib/chartMath'

interface Props {
  nodes: NodeWithPosition[]
  dims: ChartDimensions
  opScale: (v: number) => number
  wScale: (v: number) => number
  phase: IntroPhase
  hoveredNode: string | null
  pinnedNode: string | null
  reducedMotion: boolean
}

interface CurvePair {
  key: string
  zName: string
  wName: string
  d: string
  opacity: number
  strokeWidth: number
}

export function CurveLayer({
  nodes, dims, opScale, wScale,
  phase, hoveredNode, pinnedNode, reducedMotion,
}: Props) {
  const pathRefs = useRef<Map<string, SVGPathElement>>(new Map())

  const posMap = new Map(nodes.map(n => [n.raumbezug, n]))
  const contrastPairs = getContrastPairs(nodes, pinnedNode ?? hoveredNode)

  const pairs: CurvePair[] = []
  for (const pair of contrastPairs) {
    const pZ = posMap.get(pair.positive.raumbezug)
    const pW = posMap.get(pair.negative.raumbezug)
    if (!pZ || !pW) continue
    const combined = Math.abs(pair.positive.indikatorwert) + Math.abs(pair.negative.indikatorwert)
    pairs.push({
      key: `${pair.positive.raumbezug}—${pair.negative.raumbezug}`,
      zName: pair.positive.raumbezug,
      wName: pair.negative.raumbezug,
      d: bezierPath(pZ, pW, dims),
      opacity: opScale(combined),
      strokeWidth: wScale(combined),
    })
  }

  // Animate stroke-dashoffset on intro phase 3
  useEffect(() => {
    if (phase < 3 || reducedMotion) return
    pathRefs.current.forEach(el => {
      const len = el.getTotalLength()
      el.style.strokeDasharray = String(len)
      el.style.strokeDashoffset = String(len)
      el.style.transition = 'stroke-dashoffset 800ms cubic-bezier(0.33,1,0.68,1)'
      // Force reflow then animate
      void el.getBoundingClientRect()
      el.style.strokeDashoffset = '0'
    })
  }, [phase, reducedMotion])

  // Determine interaction state
  const activeNode = pinnedNode ?? hoveredNode
  const isInteracting = activeNode !== null

  return (
    <g className="curves">
      {pairs.map((pair, i) => {
        const isRelated = pair.zName === activeNode || pair.wName === activeNode
        let opacity: number
        if (phase < 3) {
          opacity = 0
        } else if (isInteracting) {
          opacity = isRelated ? pair.opacity : pair.opacity * 0.35
        } else {
          opacity = pair.opacity
        }

        return (
          <path
            key={pair.key}
            ref={el => {
              if (el) pathRefs.current.set(pair.key, el)
              else pathRefs.current.delete(pair.key)
            }}
            fill="none"
            d={pair.d}
            stroke="var(--color-chart-line)"
            strokeWidth={pair.strokeWidth}
            style={{
              opacity,
              strokeDasharray: reducedMotion ? undefined : undefined,
              transition: i === 0 && phase < 3
                ? undefined
                : 'opacity 150ms ease',
            }}
          />
        )
      })}
    </g>
  )
}
