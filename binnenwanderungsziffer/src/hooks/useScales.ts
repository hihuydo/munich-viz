import { useMemo } from 'react'
import * as d3 from 'd3'

export function useScales(globalMax: number) {
  return useMemo(() => {
    const rScale = d3.scaleSqrt().domain([0, globalMax]).range([3, 14])
    const opScale = d3.scaleLinear().domain([0, globalMax * 2]).range([0.12, 0.55])
    const wScale = d3.scaleLinear().domain([0, globalMax * 2]).range([0.6, 2.2])
    return { rScale, opScale, wScale }
  }, [globalMax])
}
