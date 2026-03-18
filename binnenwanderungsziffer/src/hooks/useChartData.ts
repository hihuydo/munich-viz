import { useEffect, useMemo, useState } from 'react'
import { max } from 'd3'
import type { BinnenwanderungRecord, RawData } from '@/data/types'

interface ParsedChartData {
  allRecords: BinnenwanderungRecord[]
  globalMax: number
  years: number[]
}

let cachedData: ParsedChartData | null = null
let cachedPromise: Promise<ParsedChartData> | null = null

function parseRawData(raw: RawData): ParsedChartData {
  const allRecords = raw.records
    .map(r => ({
      id: r[0] as number,
      auspragung: r[2] as BinnenwanderungRecord['auspragung'],
      jahr: Number(r[3]),
      raumbezug: r[4] as string,
      indikatorwert: Number(r[5]),
      zugezogene: r[6] === 'NA' ? null : Number(r[6]),
      weggezogene: r[7] === 'NA' ? null : Number(r[7]),
      bevoelkerung: r[8] === 'NA' ? null : Number(r[8]),
    }))
    .filter(r => r.raumbezug !== 'Stadt München')

  return {
    allRecords,
    globalMax: max(allRecords, r => Math.abs(r.indikatorwert)) ?? 1,
    years: [...new Set(allRecords.map(r => r.jahr))].sort((a, b) => a - b),
  }
}

async function loadChartData(): Promise<ParsedChartData> {
  if (cachedData) return cachedData
  if (!cachedPromise) {
    cachedPromise = import('../../data/binnenwanderung.json')
      .then(module => parseRawData(module.default as RawData))
      .then(parsed => {
        cachedData = parsed
        return parsed
      })
  }

  return cachedPromise
}

export function useChartData(jahr: number, auspragung: string) {
  const [data, setData] = useState<ParsedChartData | null>(cachedData)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let isMounted = true

    loadChartData()
      .then(parsed => {
        if (isMounted) setData(parsed)
      })
      .catch(cause => {
        if (isMounted) {
          setError(cause instanceof Error ? cause : new Error('Failed to load chart data'))
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const filtered = useMemo(
    () => data?.allRecords.filter(r => r.jahr === jahr && r.auspragung === auspragung) ?? [],
    [data, jahr, auspragung],
  )

  return {
    filtered,
    allRecords: data?.allRecords ?? [],
    globalMax: data?.globalMax ?? 1,
    years: data?.years ?? [],
    isLoading: data === null && error === null,
    error,
  }
}
