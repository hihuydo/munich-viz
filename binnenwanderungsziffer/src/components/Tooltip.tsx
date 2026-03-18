import type { NodeWithPosition } from '@/data/types'
import { districtLabel } from '@/lib/chartMath'

const GAP = 20
const MARGIN = 8

interface Props {
  data: NodeWithPosition
  containerWidth: number
  containerHeight: number
  rightPad?: number
}

export function Tooltip({ data, containerWidth, containerHeight, rightPad = 0 }: Props) {
  const cx = containerWidth / 2
  const cy = containerHeight / 2
  const { x: nodeX, y: nodeY } = data

  const dx = nodeX - cx
  const dy = nodeY - cy

  // Estimate card size (same as CSS min-width)
  const elW = 196
  const elH = 146

  // Try preferred quadrant first, then fall back to opposite if clamped position covers node
  const tryLeft = (preferRight: boolean): number => {
    const candidate = preferRight ? nodeX + GAP : nodeX - elW - GAP
    const clamped = Math.max(MARGIN, Math.min(candidate, containerWidth - elW - MARGIN - rightPad))
    return clamped
  }
  const tryTop = (preferDown: boolean): number => {
    const candidate = preferDown ? nodeY + GAP : nodeY - elH - GAP
    const clamped = Math.max(MARGIN, Math.min(candidate, containerHeight - elH - MARGIN))
    return clamped
  }

  const coversNodeH = (l: number) => l <= nodeX && nodeX <= l + elW
  const coversNodeV = (t: number) => t <= nodeY && nodeY <= t + elH

  // Primary: place based on which half the node is in
  let left = tryLeft(dx >= 0)
  let top  = tryTop(dy >= 0)

  // If after clamping the card covers the node horizontally, try the other side
  if (coversNodeH(left)) {
    const alt = tryLeft(dx < 0)
    if (!coversNodeH(alt)) left = alt
  }

  // If after clamping the card covers the node vertically, try the other side
  if (coversNodeV(top)) {
    const alt = tryTop(dy < 0)
    if (!coversNodeV(alt)) top = alt
  }

  const sign = data.indikatorwert > 0 ? '+' : ''
  const isPositive = data.indikatorwert >= 0

  return (
    <div
      className="absolute pointer-events-none z-10"
      role="status"
      aria-live="polite"
      style={{
        left,
        top,
        background: '#ffffff',
        border: '1px solid #000000',
        padding: '16px 18px',
        minWidth: elW,
        maxWidth: 212,
      }}
    >
      <div style={{ fontSize: 14, color: '#000000', marginBottom: 6, fontFamily: 'var(--font-serif)', lineHeight: 1.45 }}>
        {districtLabel(data.raumbezug)}
      </div>
      <div style={{
        fontSize: 30,
        fontFamily: 'var(--font-serif)',
        color: isPositive ? 'var(--accent-green)' : 'var(--accent-orange)',
      }}>
        {sign}{data.indikatorwert.toFixed(1)}
      </div>
      <div style={{ fontSize: 11, color: '#000000', letterSpacing: 0.8, marginBottom: 8, marginTop: 4 }}>
        SALDO JE 1.000 EW.
      </div>
      <TooltipRow label="ZUZÜGE" value={data.zugezogene?.toLocaleString('de-DE') ?? '—'} />
      <TooltipRow label="WEGZÜGE" value={data.weggezogene?.toLocaleString('de-DE') ?? '—'} />
    </div>
  )
}

function TooltipRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      gap: 12,
      fontSize: 11,
      color: '#000000',
      letterSpacing: 0.4,
      marginTop: 5,
    }}>
      <span>{label}</span>
      <span style={{ color: '#000000' }}>{value}</span>
    </div>
  )
}
