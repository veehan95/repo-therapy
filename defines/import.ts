import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync
} from 'node:fs'
import { dirname, extname, join } from 'node:path'
import { register } from 'ts-node'
import {
  defineRepoTherapyWrapper,
  defineRepoTherapyInternalWrapper as wrapper
} from './wrapper'
import { type Util } from '../types/repo-therapy'
import { GenerateStatus, NodeJavaScriptExt, NodeTypeScriptExt } from '../enums'

interface ImportOptionsbase {
  soft?: boolean
  absolute?: boolean
}

let tsImported = false

export async function genericImport<T> (path: string, ext = extname(path)) {
  if (
    !tsImported &&
    (Object.values(NodeTypeScriptExt) as Array<string>).includes(ext)
  ) {
    register({ transpileOnly: true })
    tsImported = true
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require(path) as T
}

export function defineRepoTherapyImport () {
  type ScriptObj = Record<
    string,
    Promise<ReturnType<typeof defineRepoTherapyWrapper>> |
      ReturnType<typeof defineRepoTherapyWrapper>
  >

  type ScriptObjReturn <T extends ScriptObj> = {
    [s in keyof T]: () => ReturnType<Awaited<T[s]>>
  }

  return wrapper('import', async (libTool) => {
    const AbsoluteRegExp = new RegExp(`^${libTool.absolutePath.root}`)

    async function importWrapper <T extends Util.GenericType> (
      path: Util.Path,
      callback: (fPath: string, ext: string) => Promise<T> | T,
      options: ImportOptionsbase = {}
    ) {
      const fPath = options?.absolute
        ? path
        : join(libTool.absolutePath.root, path)

      if (!options?.soft) {
        if (!existsSync(fPath)) { throw new Error(`${path} not found.`) }
        if (lstatSync(fPath).isDirectory()) {
          throw new Error(`Can't import directory ${path}.`)
        }
        if (/\.d\.ts/.test(fPath)) {
          throw new Error(`Can't import type declaration ${path}.`)
        }
      }

      const ext = extname(path)

      const base = {
        ext,
        path: `/${path.replace(AbsoluteRegExp, '')}`
          .replace(/^\/\//, '/') as Util.Path,
        fullPath: fPath,
        import: undefined as (
          typeof options.soft extends true
            ? undefined | Awaited<ReturnType<typeof callback>>
            : Awaited<ReturnType<typeof callback>>
        )
      }

      try {
        base.import = await callback(fPath, ext)
      } catch (e) { if (!options.soft) { throw e } }
      return base
    }

    function importScript <T extends ScriptObj> (
      path: Util.ScriptPath,
      options: ImportOptionsbase & { accept: Record<keyof T, Array<string>> }
    ) {
      return importWrapper<
        ScriptObjReturn<T>
      >(path, async (fPath, ext) => {
        if (
          !(Object.values(NodeJavaScriptExt) as Array<string>).includes(ext) &&
          !(Object.values(NodeTypeScriptExt) as Array<string>).includes(ext)
        ) { throw new Error(`Invalid script import ${path}`) }

        const x = await genericImport<T>(fPath)
        const lib = {} as ScriptObjReturn<T>
        for (const k in options.accept) {
          const wrapper = await x[k]
          wrapper.validate(options.accept[k])
          lib[k] = (() => wrapper(libTool)) as ScriptObjReturn<T>[typeof k]
        }

        return lib
      }, options)
    }

    function importNodeScript <T extends Record<string, Util.GenericType>> (
      path: Util.ScriptPath,
      options?: ImportOptionsbase
    ) {
      return importWrapper<T>(path, async (fPath, ext) => {
        if (
          !(Object.values(NodeJavaScriptExt) as Array<string>).includes(ext) &&
          !(Object.values(NodeTypeScriptExt) as Array<string>).includes(ext)
        ) { throw new Error(`Invalid node script import ${path}`) }
        return genericImport<T>(fPath)
      }, options)
    }

    function importJson <
      T extends Record<string, Util.GenericType> | Array<Util.GenericType>
    > (
      path: Util.JsonPath,
      options?: ImportOptionsbase
    ) {
      return importWrapper<T>(path, async (fPath, ext) => {
        if (ext !== '.json') { throw new Error(`Invalid json import ${path}`) }
        return (await import(fPath, { with: { type: 'json' } })).default as T
      }, options)
    }

    function importStatic (
      path: Util.Path,
      options: ImportOptionsbase & { encoding?: BufferEncoding } = {}
    ) {
      return importWrapper<string>(path, (fPath) => {
        return readFileSync(fPath, options.encoding || 'utf-8')
      }, options)
    }

    async function importDirWrapper <
      T extends Util.GenericType,
      U extends Util.Path = Util.Path,
      V extends ImportOptionsbase = ImportOptionsbase
    > (
      path: Util.Path,
      options: V | undefined,
      callback: (path: U, options: V) => ReturnType<typeof importWrapper<T>>
    ) {
      const d = typeof path === 'string' ? [path] : path
      const acc: Array<{
        relativePath: Util.Path
        dir: Util.Path
      } & Awaited<ReturnType<typeof callback>>> = []

      for (const i in d) {
        const dir = options?.absolute
          ? (d[i].replace(AbsoluteRegExp, '') as Util.Path)
          : d[i]
        const dirPath = join(libTool.absolutePath.root, dir)
        const files = readdirSync(
          dirPath,
          { recursive: true, encoding: 'utf-8' }
        )
        for (const j in files) {
          acc.push({
            relativePath: `/${files[j]}`,
            dir,
            ...await callback(join(dir, files[j]) as U, {
              ...(options || {}),
              absolute: false
            } as V)
          })
        }
      }
      return acc
    }

    async function writeStatic (
      path: Util.Path,
      callback: (s?: string) => Promise<string> | string,
      // todo enum
      { overwrite, encoding }: {
        overwrite?: boolean
        encoding?: BufferEncoding
      } = {}
    ) {
      const p = await importStatic(path, { soft: true })
      let status: GenerateStatus = GenerateStatus.noAction
      if (!p.import) {
        status = GenerateStatus.created
      } else if (overwrite !== false) { status = GenerateStatus.updated }

      if (status !== GenerateStatus.noAction) {
        const dir = dirname(p.fullPath)
        if (!existsSync(dir)) { mkdirSync(dir, { recursive: true }) }
        writeFileSync(
          p.fullPath,
          await callback(p.import),
          { encoding: encoding || 'utf-8' }
        )
      }

      return { path: p.path, status }
    }

    return {
      importScript,
      importNodeScript,
      importJson,
      importStatic,
      importScriptFromDir: <T extends ScriptObj> (
        path: Util.Path,
        options: ImportOptionsbase & { accept: Record<keyof T, Array<string>> }
      ) => importDirWrapper<
        ScriptObjReturn<T>,
        Util.ScriptPath,
        ImportOptionsbase & { accept: Record<keyof T, Array<string>> }
      >(
        path,
        options,
        importScript<T>
      ),
      importNodeScriptFromDir: <
        T extends Record<string, ReturnType<typeof defineRepoTherapyWrapper>>
      > (
        path: Util.Path,
        options: ImportOptionsbase
      ) => importDirWrapper<T, Util.ScriptPath>(
        path,
        options,
        importNodeScript<T>
      ),
      importJsonFromDir: <
        T extends Record<string, Util.GenericType> | Array<Util.GenericType>
      > (
        path: Util.Path,
        options: ImportOptionsbase
      ) => importDirWrapper<T, Util.JsonPath>(
        path,
        options,
        importJson<T>
      ),
      importStaticFromDir: (
        path: Util.Path,
        options: ImportOptionsbase & { encoding?: BufferEncoding }
      ) => importDirWrapper<string>(
        path,
        options,
        importStatic
      ),
      writeStatic
    }
  })
}
