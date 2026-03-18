import { useEffect, useState } from 'react'

/** 0 = everything hidden, 1 = bg rings, 2 = nodes, 3 = curves, 4 = pulse, 5 = sidebar */
export type IntroPhase = 0 | 1 | 2 | 3 | 4 | 5

export function useIntroAnimation(): IntroPhase {
  const [phase, setPhase] = useState<IntroPhase>(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 0)
    const t2 = setTimeout(() => setPhase(2), 500)
    const t3 = setTimeout(() => setPhase(3), 1500)
    const t4 = setTimeout(() => setPhase(4), 2500)
    const t5 = setTimeout(() => setPhase(5), 3000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5) }
  }, [])

  return phase
}
