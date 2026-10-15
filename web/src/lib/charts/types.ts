export type Cite = { t: string; href?: string }[];
export interface TableData { cols: string[]; rows: (string | number)[][]; format?: (v: number) => string }
export interface SeriesPt { x: number; y: number }
export interface Series { name: string; hot?: boolean; pts: SeriesPt[] }
