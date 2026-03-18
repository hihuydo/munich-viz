import type { NodeWithPosition } from '@/data/types'
import { districtLabel } from '@/lib/chartMath'

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
  const elW = 196
  const elH = 146

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
      role="status"
      aria-live="polite"
      style={{
        left,
        top,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-base)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 18px',
        minWidth: elW,
        maxWidth: 212,
        boxShadow: '0 12px 32px var(--color-shadow-card)',
      }}
    >
      <div style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 6, fontFamily: 'var(--font-serif)', lineHeight: 1.45 }}>
        {districtLabel(data.raumbezug)}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: 0.8, marginBottom: 4 }}>
        SALDO JE 1.000 EW.
      </div>
      <div style={{
        fontSize: 30,
        fontFamily: 'var(--font-serif)',
        marginBottom: 12,
        color: isPositive ? 'var(--accent-green)' : 'var(--accent-orange)',
      }}>
        {sign}{data.indikatorwert.toFixed(1)}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: 8 }}>
        Normierter Saldo, keine Prozentzahl und keine absolute Personenzahl.
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
      color: 'var(--text-secondary)',
      letterSpacing: 0.4,
      marginTop: 5,
    }}>
      <span>{label}</span>
      <span style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}
