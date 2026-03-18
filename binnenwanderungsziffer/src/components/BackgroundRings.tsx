import type { ChartDimensions } from '@/data/types'
import type { IntroPhase } from '@/hooks/useIntroAnimation'

interface Props {
  dims: ChartDimensions
  phase: IntroPhase
}

const RATIOS = [0.35, 0.55, 0.78] as const

export function BackgroundRings({ dims, phase }: Props) {
  const visible = phase >= 1
  return (
    <g className="bg">
      {RATIOS.map((ratio, i) => (
        <circle
          key={ratio}
          cx={dims.cx}
          cy={dims.cy}
          r={(dims.size / 2) * ratio}
          fill="none"
          stroke="#0e1e30"
          strokeWidth={0.5}
          strokeDasharray={ratio < 0.78 ? '1,4' : undefined}
          style={{
            opacity: visible ? 1 : 0,
            transition: `opacity 400ms ease ${i * 80}ms`,
          }}
        />
      ))}
    </g>
  )
}
