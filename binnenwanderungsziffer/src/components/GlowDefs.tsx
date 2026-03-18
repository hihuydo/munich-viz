export function GlowDefs() {
  return (
    <defs>
      <filter id="glow-soft">
        <feGaussianBlur stdDeviation={3} result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="glow-strong">
        <feGaussianBlur stdDeviation={6} result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  )
}
