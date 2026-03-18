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
        fill="#0a1525"
        stroke="#1a3050"
        strokeWidth={0.5}
      />
      <text
        x={dims.cx}
        y={dims.cy - 4}
        textAnchor="middle"
        fill="#8aa0b8"
        fontSize={dims.size * 0.035}
        fontFamily="Georgia, serif"
      >
        {jahr}
      </text>
      <text
        x={dims.cx}
        y={dims.cy + dims.size * 0.025}
        textAnchor="middle"
        fill="#2a4060"
        fontSize={dims.size * 0.017}
        letterSpacing={2}
      >
        MÜNCHEN
      </text>
    </g>
  )
}
