import { existsSync, lstatSync, readdirSync, readFileSync } from 'fs'
import { dirname, extname, join } from 'path'
import { register } from 'ts-node'
import { findUp } from 'find-up'
import { defineRepoTherapyWrapper as wrapper } from './wrapper'
import { defineRepoTherapyCsv } from './csv'

let tsImported = false

const f: typeof defineRepoTherapyImport = <T = object, U = string> (
  options: Partial<{
    packageJsonPath: string
    encoding: BufferEncoding
    headers: U extends `${string}.csv` ? Array<string> : undefined
    accept: Record<string, string>
    match?: RegExp
  }> = {}
) => wrapper('define-import', () => {
    const rootPath: Promise<string> = (new Promise<string>((resolve) => {
      if (options.packageJsonPath) {
        resolve(options.packageJsonPath)
      } else {
        findUp('package.json').then(x => resolve(x || process.cwd()))
      }
    })).then(x => dirname(x))

    async function importScript (
      path: U,
      { soft = false }: RepoTherapyUtil.DeepPartial<{ soft?: boolean }> = {}
    ): Promise<RepoTherapy.ImportObject<T>> {
      const fPath = join(await rootPath, path as string)
      if (!soft) {
        if (!existsSync(fPath)) { throw new Error(`${path} not found.`) }
        if (lstatSync(fPath).isDirectory()) {
          throw new Error(`Can't import directory ${path}.`)
        }
        if (/\.d\.ts/.test(fPath)) {
          throw new Error(`Can't import type declaration ${path}.`)
        }
      }

      const ext = extname(fPath)
      if (
        !tsImported &&
        extname(__filename) === '.js' &&
        extname(fPath) === '.ts'
      ) {
        register({ transpileOnly: true })
        tsImported = true
      }
      // todo force type
      let lib: T | undefined
      const scriptExt = ['.js', '.cjs', '.mjs', '.jsx', '.ts', '.tsx']
      if (scriptExt.includes(ext)) {
        if (!options.accept) {
          throw new Error('Script accepted definition not defined ')
        }
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const x = require(fPath)
          lib = Object.fromEntries(
            Object.entries(options.accept).map(([k, v]) => {
              const _v = (typeof v === 'string' ? [v] : v) as Array<string>
              if (!_v.includes(x[k].slug)) {
                throw new Error(`Defination for ${
                x[k].slug
              } found instead of ${JSON.stringify(_v)}`)
              }
              return [k, x[k]]
            })
          ) as T
        } catch {}
      } else if (ext === '.json') {
        try {
          lib = (await import(fPath, { with: { type: 'json' } })).default
        } catch {}
      } else if (ext === '.csv') {
        const headers = options.headers as Array<string>
        if (!headers) { throw new Error('Reading a csv must have header') }
        try {
          lib = await defineRepoTherapyCsv(headers)(fPath).read() as T
        } catch {}
      } else {
        try {
          lib = readFileSync(fPath, options.encoding || 'utf-8') as unknown as T
        } catch {}
      }

      return {
        ext,
        path: `/${path}`.replace(/^\/\//, '/'),
        fullPath: fPath,
        import: lib
      }
    }

    async function importScriptFromDir (
      path: string,
      localOption?: RepoTherapyUtil.DeepPartial<{ soft?: boolean }>
    ) {
      const awaitedRootPath = await rootPath
      const cleanPath = path.replace(new RegExp(`^${awaitedRootPath}`), '')
      const fPath = join(awaitedRootPath, cleanPath)
      if (!existsSync(fPath)) { return [] }
      const d = readdirSync(fPath, { recursive: true, encoding: 'utf-8' })
      const r: Array<{
        dir: string
        relativePath: string
      } & RepoTherapy.ImportObject<T>> = []
      for (let i = 0; i < d.length; i++) {
        if (options.match && !options.match.test(d[i])) { continue }
        r.push({
          dir: cleanPath,
          relativePath: d[i],
          ...await importScript(join(cleanPath, d[i]) as U, localOption)
        })
      }
      return r
    }

    return {
      rootPath,
      importScript,
      importScriptFromDir
    }
  })

export { f as defineRepoTherapyImport }
