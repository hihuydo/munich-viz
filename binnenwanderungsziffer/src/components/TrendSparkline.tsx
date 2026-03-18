interface Props {
  values: number[]
  width?: number
  height?: number
}

export function TrendSparkline({ values, width = 220, height = 72 }: Props) {
  if (values.length === 0) {
    return (
      <div
        style={{
          width,
          height,
          display: 'grid',
          placeItems: 'center',
          color: 'var(--text-secondary)',
          fontSize: 11,
          letterSpacing: 1,
          border: '1px solid var(--border-quiet)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        Keine Trenddaten
      </div>
    )
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width
      const y = height - ((value - min) / range) * height
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  const baselineY = height - ((0 - min) / range) * height
  const lastValue = values[values.length - 1] ?? 0
  const stroke = lastValue >= 0 ? 'var(--accent-green)' : 'var(--accent-orange)'

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      style={{
        width: '100%',
        height,
        overflow: 'visible',
      }}
    >
      {min < 0 && max > 0 && (
        <line
          x1={0}
          x2={width}
          y1={baselineY}
          y2={baselineY}
          stroke="var(--border-strong)"
          strokeDasharray="4 4"
        />
      )}
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={width}
        cy={height - ((lastValue - min) / range) * height}
        r={4}
        fill={stroke}
      />
    </svg>
  )
}
