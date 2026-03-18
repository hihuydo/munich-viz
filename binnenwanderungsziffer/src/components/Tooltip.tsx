import type { NodeWithPosition } from '@/data/types'

const GAP = 14
const MARGIN = 8

interface Props {
  data: NodeWithPosition
  containerWidth: number
  containerHeight: number
}

export function Tooltip({ data, containerWidth, containerHeight }: Props) {
  const cx = containerWidth / 2
  const cy = containerHeight / 2
  const { x: nodeX, y: nodeY } = data

  const dx = nodeX - cx
  const dy = nodeY - cy

  // Estimate card size (same as CSS min-width)
  const elW = 180
  const elH = 120

  let left = dx >= 0 ? nodeX + GAP : nodeX - elW - GAP
  let top  = dy >= 0 ? nodeY + GAP : nodeY - elH - GAP

  if (left < MARGIN) left = MARGIN
  if (left + elW > containerWidth - MARGIN) left = containerWidth - elW - MARGIN
  if (top < MARGIN) top = MARGIN
  if (top + elH > containerHeight - MARGIN) top = containerHeight - elH - MARGIN

  const sign = data.indikatorwert > 0 ? '+' : ''
  const isPositive = data.indikatorwert >= 0

  return (
    <div
      className="absolute pointer-events-none z-10"
      style={{
        left,
        top,
        background: '#0b1827',
        border: '1px solid #1a3050',
        borderRadius: 4,
        padding: '16px 18px',
        minWidth: elW,
        maxWidth: 200,
      }}
    >
      <div style={{ fontSize: 13, color: '#8aa0b8', marginBottom: 8, fontFamily: 'Georgia, serif', lineHeight: 1.5 }}>
        {data.raumbezug}
      </div>
      <div style={{
        fontSize: 28,
        fontFamily: 'Georgia, serif',
        marginBottom: 14,
        color: isPositive ? '#4ade80' : '#fb923c',
      }}>
        {sign}{data.indikatorwert.toFixed(1)}
      </div>
      <TooltipRow label="ZUGEZOGENE" value={data.zugezogene?.toLocaleString('de-DE') ?? '—'} />
      <TooltipRow label="WEGGEZOGENE" value={data.weggezogene?.toLocaleString('de-DE') ?? '—'} />
      <TooltipRow label="PRO 1.000 EW" value="normiert" />
    </div>
  )
}

function TooltipRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      gap: 12,
      fontSize: 9,
      color: '#4a6880',
      letterSpacing: 1,
      marginTop: 6,
    }}>
      <span>{label}</span>
      <span style={{ color: '#8aa0b8' }}>{value}</span>
    </div>
  )
}
