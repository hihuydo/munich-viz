import { useMemo } from 'react'
import * as d3 from 'd3'
import rawJson from '../../data/binnenwanderung.json'
import type { BinnenwanderungRecord, RawData } from '@/data/types'

const raw = rawJson as RawData

// Parse once at module level — immutable, never changes
const ALL_RECORDS: BinnenwanderungRecord[] = raw.records
  .map(r => ({
    id:            r[0] as number,
    auspragung:    r[2] as BinnenwanderungRecord['auspragung'],
    jahr:          Number(r[3]),
    raumbezug:     r[4] as string,
    indikatorwert: Number(r[5]),
    zugezogene:    r[6] === 'NA' ? null : Number(r[6]),
    weggezogene:   r[7] === 'NA' ? null : Number(r[7]),
    bevoelkerung:  r[8] === 'NA' ? null : Number(r[8]),
  }))
  .filter(r => r.raumbezug !== 'Stadt München')

const GLOBAL_MAX = d3.max(ALL_RECORDS, r => Math.abs(r.indikatorwert)) ?? 1
const YEARS = [...new Set(ALL_RECORDS.map(r => r.jahr))].sort((a, b) => a - b)

export function useChartData(jahr: number, auspragung: string) {
  const filtered = useMemo(
    () => ALL_RECORDS.filter(r => r.jahr === jahr && r.auspragung === auspragung),
    [jahr, auspragung],
  )

  return { filtered, globalMax: GLOBAL_MAX, years: YEARS }
}
