import { useEffect, useRef } from 'react'
import type { NodeWithPosition, ChartDimensions } from '@/data/types'
import type { IntroPhase } from '@/hooks/useIntroAnimation'
import { bezierPath, getTop5 } from '@/lib/chartMath'

interface Props {
  nodes: NodeWithPosition[]
  dims: ChartDimensions
  globalMax: number
  opScale: (v: number) => number
  wScale: (v: number) => number
  phase: IntroPhase
  hoveredNode: string | null
  pinnedNode: string | null
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
  nodes, dims, globalMax: _globalMax, opScale, wScale,
  phase, hoveredNode, pinnedNode,
}: Props) {
  const pathRefs = useRef<Map<string, SVGPathElement>>(new Map())

  const posMap = new Map(nodes.map(n => [n.raumbezug, n]))
  const { top5zuzug, top5wegzug } = getTop5(nodes)

  const pairs: CurvePair[] = []
  for (const z of top5zuzug) {
    for (const w of top5wegzug) {
      const pZ = posMap.get(z.raumbezug)
      const pW = posMap.get(w.raumbezug)
      if (!pZ || !pW) continue
      const combined = Math.abs(z.indikatorwert) + Math.abs(w.indikatorwert)
      pairs.push({
        key: `${z.raumbezug}—${w.raumbezug}`,
        zName: z.raumbezug,
        wName: w.raumbezug,
        d: bezierPath(pZ, pW, dims),
        opacity: opScale(combined),
        strokeWidth: wScale(combined),
      })
    }
  }

  // Animate stroke-dashoffset on intro phase 3
  useEffect(() => {
    if (phase < 3) return
    pathRefs.current.forEach(el => {
      const len = el.getTotalLength()
      el.style.strokeDasharray = String(len)
      el.style.strokeDashoffset = String(len)
      el.style.transition = 'stroke-dashoffset 800ms cubic-bezier(0.33,1,0.68,1)'
      // Force reflow then animate
      void el.getBoundingClientRect()
      el.style.strokeDashoffset = '0'
    })
  }, [phase])

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
          opacity = isRelated ? pair.opacity : pair.opacity * 0.1
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
            stroke="rgba(255,255,255,1)"
            strokeWidth={pair.strokeWidth}
            style={{
              opacity,
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
