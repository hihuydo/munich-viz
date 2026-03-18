export type Auspragung = 'deutsch' | 'nichtdeutsch' | 'insgesamt'

export interface BinnenwanderungRecord {
  id: number
  auspragung: Auspragung
  jahr: number
  raumbezug: string
  indikatorwert: number
  zugezogene: number | null
  weggezogene: number | null
  bevoelkerung: number | null
}

export interface NodeWithPosition extends BinnenwanderungRecord {
  x: number
  y: number
  angle: number
}

export interface ChartDimensions {
  width: number
  height: number
  cx: number
  cy: number
  ringR: number
  size: number
}

export interface TrendPoint {
  year: number
  value: number
}

/** Raw record from JSON — index-accessed array */
export type RawRecord = [
  number,         // 0 _id
  string,         // 1 Indikator
  string,         // 2 Auspragung
  number | string,// 3 Jahr
  string,         // 4 Raumbezug
  number | string,// 5 Indikatorwert
  string,         // 6 Basiswert.1 (zugezogene | "NA")
  string,         // 7 Basiswert.2 (weggezogene | "NA")
  string,         // 8 Basiswert.3 (bevoelkerung | "NA")
  ...string[]     // 9-15 unused
]

export interface RawData {
  fields: unknown[]
  records: RawRecord[]
}
