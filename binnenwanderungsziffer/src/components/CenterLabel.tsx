import type { ChartDimensions } from '@/data/types'
import type { IntroPhase } from '@/hooks/useIntroAnimation'

interface Props {
  dims: ChartDimensions
  jahr: number
  phase: IntroPhase
}

export function CenterLabel({ dims, jahr, phase }: Props) {
  return (
    <g
      className="center-label"
      style={{
        opacity: phase >= 2 ? 1 : 0,
        transition: 'opacity 500ms ease 100ms',
      }}
    >
      <text
        x={dims.cx}
        y={dims.cy + dims.size * 0.025}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="var(--text-primary)"
        fontSize={dims.size * 0.07}
        fontFamily="var(--font-serif)"
      >
        {jahr}
      </text>
    </g>
  )
}
