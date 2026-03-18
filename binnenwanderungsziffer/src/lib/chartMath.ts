import type { BinnenwanderungRecord, NodeWithPosition, ChartDimensions } from '@/data/types'

const RING_RATIO = 0.78

export function getDimensions(width: number, height: number): ChartDimensions {
  const size = Math.min(width, height)
  return {
    width,
    height,
    cx: width / 2,
    cy: height / 2,
    ringR: (size / 2) * RING_RATIO,
    size,
  }
}

export function nodePosition(
  index: number,
  total: number,
  cx: number,
  cy: number,
  r: number,
): { x: number; y: number; angle: number } {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
    angle,
  }
}

export function nodeColor(value: number): string {
  if (value > 10)  return '#4ade80'
  if (value > 0)   return '#86efac'
  if (value === 0) return '#3a5070'
  if (value > -10) return '#fdba74'
  return '#fb923c'
}

export function bezierPath(
  pA: { x: number; y: number },
  pB: { x: number; y: number },
  dims: ChartDimensions,
): string {
  return `M${pA.x},${pA.y} Q${dims.cx},${dims.cy} ${pB.x},${pB.y}`
}

/** Path from pB → pA (used for particle flow direction) */
export function bezierPathReverse(
  pA: { x: number; y: number },
  pB: { x: number; y: number },
  dims: ChartDimensions,
): string {
  return `M${pB.x},${pB.y} Q${dims.cx},${dims.cy} ${pA.x},${pA.y}`
}

export function getTop5(records: BinnenwanderungRecord[]): {
  top5zuzug: BinnenwanderungRecord[]
  top5wegzug: BinnenwanderungRecord[]
} {
  const sorted = [...records].sort((a, b) => b.indikatorwert - a.indikatorwert)
  const top5zuzug = sorted.filter(r => r.indikatorwert > 0).slice(0, 5)
  const top5wegzug = sorted.filter(r => r.indikatorwert < 0).slice(-5)
  return { top5zuzug, top5wegzug }
}

export function withPositions(
  records: BinnenwanderungRecord[],
  dims: ChartDimensions,
): NodeWithPosition[] {
  const TOTAL = 25
  const sorted = [...records].sort((a, b) => a.raumbezug.localeCompare(b.raumbezug))
  return sorted.map((d, i) => ({
    ...d,
    ...nodePosition(i, TOTAL, dims.cx, dims.cy, dims.ringR),
  }))
}
