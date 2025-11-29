import { existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

import * as csv from 'fast-csv'
import lodash from 'lodash'

import { defineRepoTherapyStreamSync } from './stream-sync'
import { defineRepoTherapyInternalWrapper as wrapper } from './wrapper'

export type CsvOption <
  RowType,
  RawRowType extends RawCsvRow<object> = RawCsvRow<RowType>
> = {
  headers: Array<string>,
  readParse?: (x: RawRowType) => RowType
  writeParse?: (x: RowType) => RawRowType
  autoGenerate?: false
} | Array<string>

export type RawCsvRow <T = object> = {
  [P in keyof T]: T[P] & string
}

export function defineRepoTherapyCsv <
  RowType,
  RawRowType extends RawCsvRow<object> = RawCsvRow<RowType>
> (option: CsvOption<RowType, RawRowType> = []) {
  return wrapper('csv', ({ absolutePath }) => {
    return async (path: `${string}.csv`) => {
      const {
        headers,
        readParse = (x: RawRowType) => x as unknown as RowType,
        writeParse: wp,
        autoGenerate
      } = Array.isArray(option)
        ? { headers: option }
        : option

      function writeParse (x: RowType) {
        return lodash.mapValues(
          wp ? wp(x) : x || {},
          (v) => typeof v === 'object' ? JSON.stringify(v) : v
        ) as RawRowType
      }

      const csvPath = join(absolutePath.root, path)

      function getRaw () {
        return defineRepoTherapyStreamSync<RawRowType>(
          csv.parseFile(csvPath, { headers: true })
        )()
      }

      async function get (): Promise<Array<RowType>> {
        return (await getRaw()).map(row => {
          return readParse(lodash.mapValues(row, (value) => {
            try {
              return typeof value === 'string' ? JSON.parse(value) : value
            } catch { return value }
          }))
        })
      }

      function writeToPath (data: Array<RawRowType>) {
        return defineRepoTherapyStreamSync<RawRowType>(
          csv.writeToPath(csvPath, data, { headers }),
          { end: 'finish' }
        )()
      }

      async function push (data: RowType) {
        await writeToPath([...await getRaw(), writeParse(data)])
      }

      async function update (rowIndex: number, data: RowType) {
        await writeToPath((await getRaw()).map((x, i) => {
          return i === rowIndex ? writeParse(data) : x
        }))
      }

      async function overwrite (data: Array<RowType>) {
        await writeToPath(data.map(writeParse))
      }

      async function remove (index: number) {
        await writeToPath((await getRaw()).filter((_, i) => i !== index))
      }

      if (autoGenerate && !existsSync(csvPath)) {
        const csvDir = dirname(csvPath)
        if (!existsSync(csvDir)) { mkdirSync(csvDir, { recursive: true }) }
        await overwrite([])
      }

      return {
        headers,
        getRaw,
        get,
        push,
        update,
        overwrite,
        remove
      }
    }
  })
}
