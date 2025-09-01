import * as csv from 'fast-csv'
import { existsSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { type ParserRow } from 'fast-csv'
import { defineRepoTherapyWrapper as wrapper } from './wrapper'

function read <T, U = T> (
  csvPath: string,
  header: Array<string>,
  readParse: (_: U | undefined) => T | undefined
): Promise<Array<U>> {
  return new Promise((resolve) => {
    const d: Array<U> = []
    try {
      csv.parseFile(csvPath, { headers: true })
        .on('data', row => {
          const x = Object.fromEntries(
            Object.entries(row as Record<string, string>)
              .filter(([k]) => header.includes(k))
              .map(([k, v]) => {
                let _v: string | number | boolean | object = v.trim()
                try { _v = JSON.parse(_v) } catch {}
                return [k, _v]
              })
          )
          const _x = readParse(x as U)
          if (_x) { d.push(_x as U) }
        })
        .on('end', () => { resolve(d) })
        .on('error', () => { resolve(d) })
    } catch { resolve(d) }
  })
}

function write <T, U = T> (
  csvPath: string,
  header: Array<string>,
  data: Array<T>,
  writeParse: (_: T | undefined) => U | undefined
) {
  csv.writeToPath(
    csvPath,
    data.map(x => writeParse(x)).filter(x => x) as Array<ParserRow<U>>,
    { headers: header }
  )
}

const f: typeof defineRepoTherapyCsv = <
  T extends object,
  U extends object = T
> (header: Array<string>, {
    readParse = (x: U | undefined) => x as T | undefined,
    writeParse = (x: T | undefined) => x as U | undefined,
    autoGenerate = false
  } = {}) => wrapper('repo-therapy-csv', (path: string) => {
    const csvPath = join(__dirname.replace(/\/node_modules\/.*$/, ''), path)

    if (autoGenerate && !existsSync(csvPath)) {
      const csvDir = dirname(csvPath)
      if (!existsSync(csvDir)) { mkdirSync(csvDir, { recursive: true }) }
      write(path, header, [], writeParse)
    }

    return {
      header,
      read: () => read<T, U>(path, header, readParse),
      write: async (data: Array<T>) => write<T, U>(
        path,
        header,
        data,
        writeParse
      )
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any

export { f as defineRepoTherapyCsv }
