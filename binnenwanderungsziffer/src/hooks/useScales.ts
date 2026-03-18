import { useMemo } from 'react'
import { scaleLinear, scaleSqrt } from 'd3'

export function useScales(globalMax: number) {
  return useMemo(() => {
    const rScale = scaleSqrt().domain([0, globalMax]).range([3, 14])
    const opScale = scaleLinear().domain([0, globalMax * 2]).range([0.12, 0.55])
    const wScale = scaleLinear().domain([0, globalMax * 2]).range([0.6, 2.2])
    return { rScale, opScale, wScale }
  }, [globalMax])
}
