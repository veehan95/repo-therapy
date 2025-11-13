import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs'
import { extname, join } from 'node:path'
import { register } from 'ts-node'
import { defineRepoTherapyInternalWrapper as wrapper } from './wrapper'
import { type LibTool } from '../types/lib-tool'
import { Util } from '../types/repo-therapy'

const nodeScriptExt = ['.js', '.ts', '.cjs', '.mjs', '.jsx', '.tsx']

interface ImportOptionsbase {
  soft?: boolean
  encoding?: BufferEncoding
}

interface NodeScriptImportOptions extends ImportOptionsbase {
  accept?: Record<string, Array<string>>
}

interface FileImportOptions extends ImportOptionsbase {
  encoding?: BufferEncoding
}

type ImportOptions <U> = U extends `${string}.json`
  ? ImportOptionsbase
  : (
    U extends `${string}${typeof nodeScriptExt[number]}`
      ? NodeScriptImportOptions
      : FileImportOptions
    )

let tsImported = false

export function defineRepoTherapyImport () {
  return wrapper('define-import', async ({
    absolutePath
  }: LibTool) => {
    async function importScript <
      T extends object | string,
      U extends Util.Path = Util.Path
    > (
      path: U,
      options: ImportOptions<U> = {} as ImportOptions<U>
    ) {
      const fPath = join(absolutePath.root, path)
      if (!options.soft) {
        if (!existsSync(fPath)) { throw new Error(`${path} not found.`) }
        if (lstatSync(fPath).isDirectory()) {
          throw new Error(`Can't import directory ${path}.`)
        }
        if (/\.d\.ts/.test(fPath)) {
          throw new Error(`Can't import type declaration ${path}.`)
        }
      }

      const ext = extname(path)
      if (!tsImported && /^\.ts(x)?$/.test(ext)) {
        register({ transpileOnly: true })
        tsImported = true
      }

      let lib: undefined | T
      if (nodeScriptExt.includes(ext)) {
        const { accept } = options as NodeScriptImportOptions
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const x = require(fPath)
          lib = accept
            ? Object.fromEntries(Object.entries(accept).map(([k, v]) => {
              if (!v.includes(x[k].slug)) {
                throw new Error(`${k} is not a defination of ${v.join(' | ')}`)
              }
              return [k, x[k]]
            })) as T
            : x
        } catch {}
      } else if (ext === '.json') {
        try {
          lib = (await import(fPath, { with: { type: 'json' } })).default
        } catch {}
      } else {
        try {
          lib = readFileSync(fPath, options.encoding || 'utf-8') as unknown as T
        } catch {}
      }

      return {
        ext,
        path: `/${path}`.replace(/^\/\//, '/') as Util.Path,
        fullPath: fPath,
        import: lib as typeof options.soft extends true ? T | undefined : T
      }
    }

    async function importScriptFromDir <
      T extends object,
      U extends Util.Path = Util.Path
    > (
      path: U | Array<U>,
      options: ImportOptions<U> = {} as ImportOptions<U>
    ) {
      const d = typeof path === 'string' ? [path] : path
      const acc: Array<{
        relativePath: string
        dir: string
      } & Awaited<ReturnType<typeof importScript<T, U>>>> = []
      for (const i in d) {
        const dir = d[i].replace(new RegExp(`^${absolutePath.root}`), '')
        const fPath = join(absolutePath.root, dir)
        const files = readdirSync(fPath, { recursive: true, encoding: 'utf-8' })
        for (const j in files) {
          const relativePath = join(dir, files[j]) as Util.Path
          acc.push({
            relativePath,
            dir,
            ...await importScript<T, typeof relativePath>(relativePath, options)
          })
        }
      }
      return acc
    }
    return {
      importScript,
      importScriptFromDir
    }
  })
}
