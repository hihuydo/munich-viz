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
      <circle
        cx={dims.cx}
        cy={dims.cy}
        r={dims.size * 0.065}
        fill="var(--bg-elevated)"
        stroke="var(--border-base)"
        strokeWidth={0.5}
      />
      <text
        x={dims.cx}
        y={dims.cy - 4}
        textAnchor="middle"
        fill="var(--text-primary)"
        fontSize={dims.size * 0.035}
        fontFamily="var(--font-serif)"
      >
        {jahr}
      </text>
      <text
        x={dims.cx}
        y={dims.cy + dims.size * 0.025}
        textAnchor="middle"
        fill="var(--text-muted)"
        fontSize={dims.size * 0.017}
        letterSpacing={2}
      >
        MÜNCHEN
      </text>
    </g>
  )
}
