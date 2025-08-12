import * as csv from 'fast-csv'
import { existsSync, mkdirSync } from 'fs'
import { camelCase } from 'lodash'
import { dirname, join } from 'path'
import { type ParserRow } from 'fast-csv'

const _defineRepoTherapyCsv: typeof defineRepoTherapyCsv = (<T, U>(
  path: string,
  { readParse, writeParse }: {
    readParse?: (_: T | U) => T | undefined
    writeParse?: (_: T | U) => T | undefined
  } = {}
) => () => {
  const t: Record<string, boolean> = { true: true, false: false }

  const csvPath = join(__dirname.replace(/\/node_modules\/.*$/, ''), path)
  const csvDir = dirname(csvPath)
  if (!existsSync(csvDir)) { mkdirSync(csvDir) }

  function read (): Promise<Array<T>> {
    return new Promise((resolve) => {
      const d: Array<T> = []
      csv.parseFile(csvPath, { headers: true })
        .on('data', row => {
          const x = Object.fromEntries(
            Object.entries(row as Record<string, string>)
              .map(([k, v]) => [camelCase(k), t[v] || v])
          )
          const _x = (x && readParse) ? readParse(x as T) : x
          if (_x) { d.push(_x as T) }
        })
        .on('end', () => { resolve(d) })
    })
  }

  async function write (data: Array<T>) {
    csv.writeToPath(
      csvPath,
      data.filter(x => x)
        .map(x => writeParse ? writeParse(x) : x) as Array<ParserRow>,
      { headers: ['path', 'alt', 'show_title'] }
    )
  }

  return { read, write }
}) as typeof defineRepoTherapyCsv

export { _defineRepoTherapyCsv as defineRepoTherapyCsv }
