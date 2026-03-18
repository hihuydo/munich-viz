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
  if (value > 10)  return 'var(--color-positive-strong)'
  if (value > 0)   return 'var(--color-positive-soft)'
  if (value === 0) return 'var(--color-neutral)'
  if (value > -10) return 'var(--color-negative-soft)'
  return 'var(--color-negative-strong)'
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
  const top5zuzug = records
    .filter(r => r.indikatorwert > 0)
    .sort((a, b) =>
      b.indikatorwert - a.indikatorwert ||
      districtNumber(a.raumbezug) - districtNumber(b.raumbezug),
    )
    .slice(0, 5)

  const top5wegzug = records
    .filter(r => r.indikatorwert < 0)
    .sort((a, b) =>
      a.indikatorwert - b.indikatorwert ||
      districtNumber(a.raumbezug) - districtNumber(b.raumbezug),
    )
    .slice(0, 5)

  return { top5zuzug, top5wegzug }
}

export function districtNumber(name: string): number {
  const match = name.match(/^(\d+)/)
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER
}

export function districtLabel(name: string): string {
  return name.replace(/^\d+\s+/, '')
}

export function getContrastPairs(
  records: BinnenwanderungRecord[],
  activeNodeName?: string | null,
): Array<{ positive: BinnenwanderungRecord; negative: BinnenwanderungRecord }> {
  const { top5zuzug, top5wegzug } = getTop5(records)

  if (!activeNodeName) {
    return top5zuzug
      .slice(0, Math.min(top5zuzug.length, top5wegzug.length))
      .map((positive, index) => ({
        positive,
        negative: top5wegzug[index]!,
      }))
  }

  const activeRecord = records.find(record => record.raumbezug === activeNodeName)
  if (!activeRecord) return []

  if (activeRecord.indikatorwert >= 0) {
    return top5wegzug.map(negative => ({
      positive: activeRecord,
      negative,
    }))
  }

  return top5zuzug.map(positive => ({
    positive,
    negative: activeRecord,
  }))
}

export function ringOrder(records: BinnenwanderungRecord[]): BinnenwanderungRecord[] {
  return [...records].sort((a, b) =>
    b.indikatorwert - a.indikatorwert ||
    districtNumber(a.raumbezug) - districtNumber(b.raumbezug),
  )
}

export function withPositions(
  records: BinnenwanderungRecord[],
  dims: ChartDimensions,
): NodeWithPosition[] {
  const TOTAL = records.length || 1
  const sorted = ringOrder(records)
  return sorted.map((d, i) => ({
    ...d,
    ...nodePosition(i, TOTAL, dims.cx, dims.cy, dims.ringR),
  }))
}
