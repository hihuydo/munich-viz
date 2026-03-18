import { useEffect, useState } from 'react'
import { useMediaQuery } from './useMediaQuery'

/** 0 = everything hidden, 1 = bg rings, 2 = nodes, 3 = curves, 4 = pulse, 5 = sidebar */
export type IntroPhase = 0 | 1 | 2 | 3 | 4 | 5

export function useIntroAnimation(): IntroPhase {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [phase, setPhase] = useState<IntroPhase>(0)

  useEffect(() => {
    if (prefersReducedMotion) {
      setPhase(5)
      return
    }

    const t1 = setTimeout(() => setPhase(1), 0)
    const t2 = setTimeout(() => setPhase(2), 300)
    const t3 = setTimeout(() => setPhase(3), 750)
    const t4 = setTimeout(() => setPhase(4), 1200)
    const t5 = setTimeout(() => setPhase(5), 1500)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5) }
  }, [prefersReducedMotion])

  return phase
}
