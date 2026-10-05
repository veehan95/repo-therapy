import { parse } from '@dotenvx/dotenvx'
import _ from 'lodash'
import { RepoTherapyUtilBase } from './base.js'
import RTDocumentedError from './error.js'
import type RepoTherapy from './repo-therapy.js'
import type RTLogger from './logger.js'
import type RTValueTypeBase from './value-type.js'
import { dirname, join } from 'node:path'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import type { FilePath, ObjectDefinition } from './types.js'
import type { ValueTypeDefinition } from '../generated/types/value-types.js'
import type ObjectUtil from './object-util.js'
import type { RTValueTypeObject } from './value-type-definitions.js'
import type { ObjectMapper } from '../generated/types/object-util.js'
import type * as EnvDefinition from '../generated/types/env.js'

type FullBaseEnv <BaseEnv extends object = {}> = BaseEnv & {
  app?: string
  appEnv: string
}

type EnvFilePath = `${FilePath}/.env` | `${FilePath}/.env.${string}`

export type Options <
  BaseEnv extends object = {},
  AppEnv extends object = {}
> = {
  definition: ReturnType<typeof RTEnv.define<BaseEnv>>
  appDefinition?: ReturnType<typeof RTEnv.define<AppEnv>>
  environment?: string
  app?: string
  mockWithDefault?: boolean
}

export default class RTEnv <
  BaseEnv extends object = {},
  AppEnv extends object = {},
  CustomOptions extends object = {}
> extends RepoTherapyUtilBase <
  {
    definition: Options['definition']
    appDefinition?: Options['appDefinition']
    mockWithDefault?: boolean
    app?: string
    environment?: string
  } & CustomOptions
> {
  private _baseEnv: FullBaseEnv<BaseEnv>
  private _baseEnvRaw: object = {}
  protected readonly _baseEnvDefinition: ReturnType<
    RTValueTypeObject<FullBaseEnv<BaseEnv>>['chainable']
  >
  protected readonly _appEnvDefinition?: ReturnType<
    RTValueTypeObject<AppEnv>['chainable']
  >
  get baseEnv () { return this._baseEnv }

  get typeDefinition () { return this._baseEnvDefinition.typeDefinition() }

  private _appEnv: AppEnv = {} as AppEnv
  private _appEnvRaw: object = {}
  get appEnv () { return this._appEnv }

  get env () { return _.merge(this.baseEnv, this._appEnv) }

  get appTypeDefinition () {
    if (!this._appEnvDefinition) {
      throw new Error('no app definition configured')
    }
    return this._appEnvDefinition.typeDefinition()
  }

  private get _baseEnvPath () {
    return join(
      process.cwd(),
      this._options.environment
        ? `./.env.${this._options.environment}`
        : './.env'
    ) as EnvFilePath
  }

  private get _appEnvPath () {
    return join(
      this._repoTherapy.appRoot,
      this._options.environment
        ? `./.env.${this._options.environment}`
        : './.env'
    ) as EnvFilePath
  }

  constructor(
    repoTherapy: RepoTherapy,
    options: Options<BaseEnv, AppEnv> & CustomOptions
  ) {
    super(repoTherapy, {
      ...options,
      environment: options.environment || 'local',
      target: options.environment
    })

    const baseEnvObj = {
      ...options.definition(this._repoTherapy),
      appEnv: repoTherapy.valueType
        .string('application env')
        .oneOf(repoTherapy.appEnvOptions)
        .default(repoTherapy.appEnvOptions[0])
    } as ObjectDefinition<FullBaseEnv<BaseEnv>>
    if (repoTherapy.appOptions && repoTherapy.appOptions.length > 0) {
      baseEnvObj.app = repoTherapy.valueType
        .string('application env')
        .oneOf(repoTherapy.appOptions)
        .default(repoTherapy.appOptions[0]) as unknown as ReturnType<
          RTValueTypeBase<FullBaseEnv<BaseEnv>['app']>['chainable']
        >
    }

    this._baseEnvDefinition = this._repoTherapy.valueType
      .object('define-env', baseEnvObj)

    if (options.appDefinition) {
      this._appEnvDefinition = this._repoTherapy.valueType
        .object('define-app-env', options.appDefinition(this._repoTherapy))
    }

    try {
      ;({
        data: this._baseEnv,
        rawData: this._baseEnvRaw
      } = this._load<
        FullBaseEnv<BaseEnv>
      >('base', this._baseEnvPath, this._baseEnvDefinition))
    } catch (e) {
      if (e instanceof RTDocumentedError) { e.reanchorStack(this.constructor) }
      throw e
    }

    if (this._options.app && this._baseEnv.app !== this._options.app) {
      throw new this.errorClass('server_conflicting_configuration', {
        message: 'Env file configured {{1}} but received {{2}}',
        fields: [this._baseEnv.app, this._options.app]
      })
    }
  }

  protected _load <T extends object> (
    namespace: string,
    path: `${FilePath}/.env` | `${FilePath}/.env.${string}`,
    definition: ReturnType<RTValueTypeObject<T>['chainable']>,
  ) {
    const l = this.logger.childContext(namespace)
    l.debug(() => [path])
    if (!existsSync(path)) {
      l.debug(() => ['env not found, creating file...'])
      mkdirSync(dirname(path), { recursive: true })
      const mock = this._repoTherapy.objectUtil.revert<
        'soft',
        T
      >('env', definition.mock(this._options.mockWithDefault))
      writeFileSync(
        path,
        Object.entries(mock).map(([k, v]) => `${k}=${v}`).join('\n')
      )
    }
    const rawDataStr = readFileSync(path, 'utf-8')
    const rawData = this._repoTherapy.objectUtil
      .map<'soft', T>('env', parse(rawDataStr))
    l.debug(() => ['env value', JSON.stringify(rawData)])
    let data: T
    try {
      data = definition.soft()(
        this._repoTherapy.objectUtil.map<'soft', T>('env', rawData)
      )
    } catch (e) {
      this.logger.debug(() => [rawData])
      if (e instanceof RTDocumentedError) { e.reanchorStack(this._load) }
      throw e
    }
    return { data, rawData }
  }

  public loadAppEnv () {
    if (!this._baseEnv.app || !this._appEnvDefinition) { return }
    try {
      ({
        data: this._appEnv,
        rawData: this._appEnvRaw
      } = this._load<
        AppEnv
      >('app', this._appEnvPath, this._appEnvDefinition))

      const baseOnlyErr = this._baseEnvDefinition.existingKeys(this._appEnvRaw)
        .map(x => new this.errorClass('invalid_element', { fields: [x] }))
      if (baseOnlyErr.length > 0) {
        const m = new this.errorClass('server_multiple', {
          message: 'Multiple: from app env',
          path: [this._appEnvPath]
        }, this.loadAppEnv)
        for (const err of baseOnlyErr) { m.push(err) }
        throw m
      }

      const appOnlyErr = this._appEnvDefinition.existingKeys(this._baseEnvRaw)
        .map(x => new this.errorClass('invalid_element', { fields: [x] }))
      if (appOnlyErr.length > 0) {
        const m = new this.errorClass('server_multiple', {
          message: 'Multiple: from base env',
          path: [this._baseEnvPath]
        }, this.loadAppEnv)
        for (const err of appOnlyErr) { m.push(err) }
        throw m
      }
    } catch (e) {
      if (e instanceof RTDocumentedError) { e.reanchorStack(this.loadAppEnv) }
      throw e
    }
  }

  static define <T extends object> (callback: (
    valueType: ValueTypeDefinition,
    objectUtil: ObjectUtil<ObjectMapper>,
    logger: RTLogger
  ) => ObjectDefinition<T>): (
    repoTherapy: RepoTherapy,
    app?: string
  ) => ObjectDefinition<T> {
    return (repoTherapy: RepoTherapy) => callback(
      repoTherapy.valueType,
      repoTherapy.objectUtil,
      repoTherapy.logger.childContext(
        'define-env',
        (repoTherapy.env.app ? repoTherapy.env.app : 'base')
      )
    )
  }

  public static async loader (repoTherapy: RepoTherapy): Promise<
    RTEnv<
      Omit<EnvDefinition.BaseEnv, 'app' | 'appEnv'>,
      EnvDefinition.AppEnv
    >
  > {
    const x = await repoTherapy.importScript<{
      default: ReturnType<typeof RTEnv.define<EnvDefinition.BaseEnv>>
      app: ReturnType<typeof RTEnv.define<EnvDefinition.AppEnv>>
    }>(['env'], '/config/env.ts')
    const env = new RTEnv<
      Omit<EnvDefinition.BaseEnv, 'app' | 'appEnv'>,
      EnvDefinition.AppEnv
    >(repoTherapy, {
      app: repoTherapy.options.app,
      environment: repoTherapy.options.environment,
      definition: x?.import.default || RTEnv.define<EnvDefinition.BaseEnv>(
        () => ({}) as ObjectDefinition<EnvDefinition.BaseEnv>
      ),
      appDefinition: x?.import.app || RTEnv.define<EnvDefinition.AppEnv>(
        () => ({}) as ObjectDefinition<EnvDefinition.AppEnv>
      ),
      mockWithDefault: true
    })
    if (env.env.app) { env.loadAppEnv() }
    return env
  }

  public static async generateTypeDefinition (repoTherapy: RepoTherapy) {
    repoTherapy.generateFile(
      '/types/env.ts',
      `export type BaseEnv = ${
        repoTherapy.envUtil.typeDefinition
      }\n\nexport type AppEnv = ${
        repoTherapy.envUtil.appTypeDefinition
      }\n\nexport type Env = BaseEnv & AppEnv\n`
    )
  }
}
