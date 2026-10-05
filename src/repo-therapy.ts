import { dirname, extname, join, resolve } from 'node:path'
import _ from 'lodash'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import '@dotenvx/dotenvx/config.js'

import RTLogger from './logger.js'
import type { FilePath } from './types.js'
import { fileURLToPath } from 'node:url'
import { existsSync, lstatSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import RTDocumentedError from './error.js'
import type { ErrorMeta } from "./types.js"
import type { ErrorCode } from '../generated/types/errors.js'
import type { ObjectMapper } from '../generated/types/object-util.js'
import { RepoTherapyBase } from './base.js'
import { RTValueType } from './value-type.js'
import type { ValueTypeDefinition } from '../generated/types/value-types.js'
import RTObjectUtil from './object-util.js'
import type { AppEnv, BaseEnv } from '../generated/types/env.js'
import type RtScript from './script.js'
import RTEnv from './env.js'

// export type ValueTypeDefinition = {
//   [K in keyof VTDefinition]: (
//     ...args: ValueTypeCtorRestArgs<VTDefinition[K]>
//   ) => ReturnType<InstanceType<VTDefinition[K]>['chainable']>
// }

// type ErrorClass = new <
//   // CodeMeta extends ErrorCodeMeta = {},
//   Code extends ErrorCode | BaseCodeName = BaseCodeName
// > (
//   code: Code,
//   input?: RTDocumentedErrorInput<Code, CodeMeta>,
//   fn?: Function
// ) => RTDocumentedError

export type Options = {
  debug?: boolean
  app?: string
  environment?: string
}

export default class RepoTherapy <
  CustomOptions extends object = {}
> extends RepoTherapyBase <
  Options & CustomOptions,
  RepoTherapy<CustomOptions>
> {
  private _logger: RTLogger = undefined as unknown as RTLogger
  public get logger () { return this._logger }

  public get directories () {
    return [
      // ...,
      resolve(dirname(fileURLToPath(import.meta.url)), '../') as FilePath
    ]
  }

  public get options () { return this._options }

  protected readonly generatedDir = resolve(
    dirname(fileURLToPath(import.meta.url)),
    '../generated'
  )

  private _errorClass: new <T extends ErrorCode>(
    code: T,
    input?: {
      fields?: (string | number | undefined)[]
      path?: string[]
      message?: string
    } & (Error | {}),
    fn?: Function
  ) => RTDocumentedError<ErrorMeta & { code: T }>
    = undefined as unknown as new <T extends ErrorCode>(
      code: T,
      input?: {
        fields?: (string | number | undefined)[]
        path?: string[]
        message?: string
      } & (Error | {}),
      fn?: Function
    ) => RTDocumentedError<ErrorMeta & { code: T }>
  public get errorClass () { return this._errorClass }

  private _valueType: ValueTypeDefinition = {} as ValueTypeDefinition
  public get valueType () { return this._valueType }

  private _objectUtil: RTObjectUtil<ObjectMapper> =
    undefined as unknown as RTObjectUtil<ObjectMapper>
  public get objectUtil () { return this._objectUtil }

  public get app () {
    return this.env.app || this._options.app || process.env['APP'] || ''
  }

  private _appOptions: string[] = []
  public get appOptions () { return this._appOptions }

  public get appEnvOptions () {
    return ['local', 'production', 'dev', 'staging', 'uat']
  }

  private _envUtil: RTEnv<Omit<BaseEnv, 'app' | 'appEnv'>, AppEnv>
    = undefined as unknown as RTEnv<Omit<BaseEnv, 'app' | 'appEnv'>, AppEnv>
  public get envUtil () { return this._envUtil }
  public get env () { return this._envUtil?.env || {} }

  public get environment () {
    return this.env.appEnv || process.env['APP_ENV'] || 'local'
  }

  public get repoRoot () { return process.cwd() }

  public get appRoot () {
    return join(this.repoRoot, 'apps', _.kebabCase(this.app)) as FilePath
  }

  constructor (options?: Options & CustomOptions) {
    super({
      ...((options || {}) as CustomOptions),
      debug: options?.debug || process.env['DEBUG'] === 'true',
      app: options?.app || process.env['APP'],
      environment: options?.environment || process.env['APP_ENV'],
    })
    this._setUtil('logger', RTLogger.loader)
    this._setUtil('errorClass', RTDocumentedError.loader)
    this._setUtil('valueType', RTValueType.loader)
    this._setUtil('objectUtil', RTObjectUtil.loader)
    this._setUtil('envUtil', RTEnv.loader)

    const appRoot = join(this.repoRoot, 'apps')
    if (!existsSync(appRoot)) { return }
    this._appOptions = readdirSync(appRoot, 'utf8')
      .filter(x => lstatSync(join(appRoot, x)).isDirectory())
  }

  protected _setUtil <K extends keyof RepoTherapy<CustomOptions> & string> (
    key: K,
    fn: (repoTherapy: RepoTherapy) => RepoTherapy<CustomOptions>[K]
      | Promise<RepoTherapy<CustomOptions>[K]>
  ) {
    this._addProcess(async () => {
      (this as unknown as Record<`_${K}`, unknown>)[`_${key}`] =
        await fn.call(this, this)
    })
  }

  public findFile (namespace: string[], path: FilePath): FilePath[]
  public findFile (
    namespace: string[],
    path: FilePath,
    stopOnFound: true
  ): FilePath
  public findFile (namespace: string[], path: FilePath, stopOnFound?: boolean) {
    this.logger?.debug(() => [...namespace, 'searching file', path])
    const r: FilePath[] = []
    for (const dir of this.directories) {
      let fullPath = join(dir, path) as FilePath
      if (!existsSync(fullPath)) {
        const ext = fullPath.match(/(\.[^/]*)$/)?.[1] || extname(fullPath)
        fullPath = fullPath
          .replace(new RegExp(`\\${ext}$`), `/index${ext}`) as FilePath
      }
      if (existsSync(fullPath)) {
        this.logger.debug(() => [...namespace, 'found', fullPath])
        if (stopOnFound) { return fullPath }
        r.push(fullPath)
      }
    }
    return stopOnFound ? undefined : r
  }

  public async importScript <T extends object> (
    namespace: string[],
    path: `${FilePath}.ts`
  ): Promise<{
    import: T
    path: `${FilePath}.ts`
  } | undefined>
  public async importScript <T extends object> (
    namespace: string[],
    path: `${FilePath}.ts`,
    all: true
  ): Promise<{
    import: T
    path: `${FilePath}.ts`
  }[]>
  public async importScript <T extends object> (
    namespace: string[],
    path: `${FilePath}.ts`,
    all?: true
  ) {
    if (!all) {
      const fullPath = this.findFile(namespace, path, true)
      if (
        !fullPath || !lstatSync(fullPath).isFile()
      ) { return }
      return { import: await import(fullPath) as T, path: fullPath }
    }
    return await Promise.all(this.findFile(namespace, path)
      .filter(x => lstatSync(x).isFile())
      .map(async fullPath => ({
        import: await import(fullPath) as T,
        path: fullPath
      }))
    )
  }

  public async importScriptDir <T extends object> (
    namespace: string[],
    dir: FilePath
  ) {
    const r: Record<string, {
      path: `${FilePath}.ts`
      import: T
    }> = {}
    for (const root of this.directories) {
      const fullPath = join(root, dir)
      if (existsSync(fullPath)) {
        const p = readdirSync(
          fullPath,
          { encoding: 'utf-8', recursive: true }
        )
        for (const path of p) {
          if (r[path]) { continue }
          const name = path.replace(/\.ts$/, '')
            .split(/\//g)
            .map(x => _.camelCase(x.trim()))
            .join(':')
          const vt = await this.importScript<T>(
            [...namespace, name],
            join(dir, path) as `${FilePath}.ts`
          )
          if (!vt) { continue }
          r[name] = vt
        }
      }
    }
    return Object.entries(r)
  }

  public generateFile (path: FilePath, content: string) {
    const p = join(this.generatedDir, path)
    const dir = dirname(p)
    if (!existsSync(dir)) { mkdirSync(dir, { recursive: true }) }
    writeFileSync(join(this.generatedDir, path), content)
  }

  public async generateTypeDefinition () {
    this.logger.debug(() => ['generating type', 'DocumentedError'])
    await RTDocumentedError.generateTypeDefinition(this)
    this.logger.debug(() => ['generating type', 'ValueType'])
    await RTValueType.generateTypeDefinition(this)
    this.logger.debug(() => ['generating type', 'ObjectUtil'])
    await RTObjectUtil.generateTypeDefinition(this)
    this.logger.debug(() => ['generating type', 'Env'])
    await RTEnv.generateTypeDefinition(this)
  }

  async loadCli () {
    const y = yargs(hideBin(process.argv))
      .scriptName('this._libName')
      .demandCommand(1)
      .strict()
    const script = await this.importScriptDir<{
      default: ReturnType<typeof RtScript.define>
    }>(['scripts'], '/scripts')
    for (const [key, s] of script) {
      await s.import.default(this, key).loadCommand(y)
    }
    y.parse()
  }

  public extendValueType <Meta extends Record<string, unknown>> (
    meta: Meta
  ): ValueTypeDefinition<Meta> {
    return Object.fromEntries(
      Object.entries(
        this.valueType as Record<string, (...args: unknown[]) => any>
      ).map(([k, v]) => [k, (...args: any[]) => v(...args).extend(meta)])
    ) as ValueTypeDefinition<Meta>
  }

  public getScriptNameFromPath (prefix: FilePath, path: FilePath) {
    const directories = this.directories.sort((a, b) => a.length - b.length)
    for (const x of directories) {
      const r = new RegExp(`^${x}${prefix}/`)
      if (r.test(path)) {
        return path.replace(r, '')
          .replace(/(^\/)|((\/index)?\.(t|j)s$)/g, '')
      }
    }
    return
  }
}
