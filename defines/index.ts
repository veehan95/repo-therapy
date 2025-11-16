import { findUp } from 'find-up'
import lodash from 'lodash'
import { dirname, join } from 'node:path'
import { type PackageJson } from 'type-fest'
import { NodeEnvOptions, PackageManager, ProjectType } from '../enums'
import { type LibTool } from '../types/lib-tool'
import { type Util } from '../types/repo-therapy'
import { defineRepoTherapyCsv, type CsvOption, type RawCsvRow } from './csv'
import { defineRepoTherapyEnum, EnumDefination } from './enum'
import { defineRepoTherapyEnv, type EnvCallback } from './env'
import { defineRepoTherapyGitIgnore, type GitignoreOptions } from './gitignore'
import { defineRepoTherapyHusky, type HuskyOptions } from './husky'
import { defineRepoTherapyImport } from './import'
import { defineRepoTherapyLogger } from './logger'
import { defineRepoTherapyPackageJson } from './package-json'
import { defineRepoTherapyStreamSync } from './stream-sync'
import { defineRepoTherapyString } from './string'
import { defineRepoTherapyValue } from './value'
import {
  defineRepoTherapyValueParse,
  type ValueDefination,
  type ValueParseOptions
} from './value-parse'
import { defineRepoTherapyVsCode, type VSCodeOptions } from './vscode'
import { defineRepoTherapyInternalWrapper as wrapper } from './wrapper'

class PathObj <RootPath extends Util.Path, LinkPath extends Util.LinkPath> {
  private _pathList: LinkPath

  private _rootPath: RootPath

  private _project = 'unknown'

  private _build: Util.Path

  private _buildCache: Util.Path

  get pathList () {
    const r = {
      projectRoot: '/project' as Util.Path,
      ...this._pathList,
      build: this._build,
      buildCache: this._buildCache,
      typeDeclaration: '/types' as Util.Path,
      project: '' as Util.Path
    }
    r.project = `${r.projectRoot}/${this._project}` as Util.Path
    return r
  }

  get absolutePath () {
    return {
      ...lodash.mapValues(this.pathList, (value) => {
        return join(this._rootPath, value) as Util.Path
      }),
      root: this._rootPath
    }
  }

  constructor (rootPath: RootPath, pathList: LinkPath, { build, buildCache }: {
    build?: Util.Path
    buildCache?: Util.Path
  } = {}) {
    this._rootPath = rootPath
    this._pathList = pathList
    this._build = build || '/dist'
    this._buildCache = buildCache || '/.repo-therapy'
  }
}

function value (description: string | Array<string>) {
  return defineRepoTherapyValue(description)()
}

export function defineRepoTherapy <
  VD extends ValueDefination,
  LinkPath extends Util.LinkPath = Util.LinkPath,
  EnumConfig extends Record<
    string,
    EnumDefination
  > = object & Record<string, EnumDefination>,
  RootPath extends Util.Path = Util.Path
> (options: {
  project?: string
  rootPath?: RootPath
  nodeEnv?: NodeEnvOptions
  linkPath?: LinkPath
  projectType?: ProjectType
  enumPaths?: Array<Util.Path>
  enumConfigs?: EnumConfig
  husky?: HuskyOptions
  gitignore?: GitignoreOptions
  vsCode?: VSCodeOptions
  // projectType: RepoTherapy.ProjectType
  // framework: Array<RepoTherapy.Framework>
  logger?: ReturnType<typeof defineRepoTherapyLogger>
  env?: EnvCallback<VD>
  envInterfaceName?: string
  // env: Env.Detail
  // serverCode: RepoTherapyUtil.DeepPartial<RepoTherapyUtil.ServerCode>
  // error: Record<string, string | {
  //   defaultMessage: string
  //   // todo stricter type declaration
  //   // defaultProp: object
  // }>
  // silent: boolean
  // // todo move to @types
  // manualModuleTyping: Array<string>
} = {}) {
  async function r ({ skipEnv }: {
    skipEnv?: boolean
  } = {}) {
    // const p = packageJsonPath
    //   ? defineRepoTherapyPackageJson({ path: packageJsonPath })
    //   : repoTherapyPackageJson
    // if (/\/node_modules\//.test(__dirname)) {
    //   const nodeModuleDir = __dirname
    //     .replace(/\/node_modules\/.*/g, '/node_modules')
    //   const typesDir = join(nodeModuleDir, '@types')
    //   if (!existsSync(typesDir)) { mkdirSync(typesDir) }
    //   ;['repo-therapy', ...manualModuleTyping].forEach((x) => {
    //     cpSync(
    //       join(__dirname, '../../types/'),
    //       join(typesDir, x),
    //       { recursive: true }
    //     )
    //   })
    // }

    const optionWithDefault = Object.assign({
    // framework,
      projectType: ProjectType.npmLib,
      linkPath: {} as LinkPath
    // serverCode = {},
    // error = {},
    // silent = false,
    // todo move to @types
    // manualModuleTyping = []
    }, options)

    const defaultRoot = await findUp('package.json')
    const pathObj = new PathObj<RootPath, LinkPath>((
      optionWithDefault.rootPath ||
      (defaultRoot ? dirname(defaultRoot) : undefined) ||
      process.cwd()
    ) as RootPath, optionWithDefault.linkPath, {
      build: optionWithDefault.projectType === ProjectType.npmLib
        ? '/bin'
        : '/dist',
      buildCache: optionWithDefault.linkPath!.buildCache || '/.repo-therapy'
    })

    const libTool = {
      projectType: optionWithDefault.projectType,
      packageManager: PackageManager.NPM,
      absolutePath: pathObj.absolutePath,
      path: pathObj.pathList,
      streamSync: (stream, option) => defineRepoTherapyStreamSync(
        stream,
        option
      )(),
      valueParser: <T extends ValueDefination> (
        defination: T,
        option?: ValueParseOptions
      ) => defineRepoTherapyValueParse(defination, option)(),
      value,
      string: () => defineRepoTherapyString()()
    // todo fix as
    } as LibTool<VD, LinkPath, EnumConfig, RootPath>

    libTool.importLib = await defineRepoTherapyImport()(libTool)

    if (
      (await libTool.importLib.importStatic('/yarn.lock', { soft: true }))
        .import
    ) { libTool.packageManager = PackageManager.Yarn }
    if (
      (await libTool.importLib.importStatic('/pnpm-lock.yaml', { soft: true }))
        .import
    ) { libTool.packageManager = PackageManager.PNPM }
    if (
      (await libTool.importLib.importStatic('/bun.lock', { soft: true })).import
    ) { libTool.packageManager = PackageManager.Bun }

    const envParser = await defineRepoTherapyEnv<VD>(optionWithDefault.env, {
      project: optionWithDefault.project,
      nodeEnv: optionWithDefault.nodeEnv,
      interfaceName: optionWithDefault.envInterfaceName,
      skip: skipEnv
    })(libTool)
    libTool.env = envParser.get()
    libTool.generateEnv = envParser.generate

    const logger = (
      optionWithDefault.logger ||
    defineRepoTherapyLogger()
    )(libTool)
    libTool.logger = logger.logger
    libTool.loggerPrint = logger.printString

    libTool.csv = <
      RowType,
      RawRowType extends RawCsvRow<object> = RawCsvRow<RowType>
    >(option: CsvOption<RowType, RawRowType>) => defineRepoTherapyCsv<
      RowType,
      RawRowType
    >(option)(libTool)

    const enums = await defineRepoTherapyEnum<EnumConfig>(
      options.enumPaths
    )(libTool)
    libTool.enum = enums.enum
    libTool.enumKeys = enums.availableKey

    libTool.husky = () => defineRepoTherapyHusky(
      options.husky
    )(libTool)

    libTool.packageJson = (
      config: Partial<PackageJson> = {}
    ) => defineRepoTherapyPackageJson(
      libTool.projectType,
      config
    )(libTool)

    libTool.gitignore = () => defineRepoTherapyGitIgnore(
      options.gitignore
    )(libTool)

    libTool.vsCode = () => defineRepoTherapyVsCode(
      options.vsCode
    )(libTool)

    return libTool
  }

  return wrapper<typeof r, undefined, false>('', () => {
    //   const libTool: RepoTherapy.DefineLibTool<T, U, Z1, Z2> = {
    //     project: project || '',
    //     path: pathList,
    //     root: {
    //       root: rootPath,
    //       ...Object.fromEntries(
    //         Object.entries(pathList).map(([k, v]) => [k, join(rootPath, v)])
    //       )
    //     } as { root: Z2 } & RepoTherapyUtil.RootPath<Z1, Z2>,
    //     env: {
    //       nodeEnv: '',
    //       project: project as string
    //     } as RepoTherapy.Env<T>,
    //     getOriginalEnv: undefined as unknown as Awaited<
    //     ReturnType<ReturnType<typeof defineRepoTherapyEnv>>
    //   >['getOriginalEnv'],
    //     generateTypeDeclaration: undefined as unknown as Awaited<
    //     ReturnType<ReturnType<typeof defineRepoTherapyEnv>>
    //   >['generateTypeDeclaration'],
    //     logger: undefined as unknown as ReturnType<
    //     ReturnType<typeof defineRepoTherapyLogger>
    //   >['logger'],
    //     import: <T = object, U = string> (
    //       options: Partial<{
    //       packageJsonPath: string
    //       encoding: BufferEncoding
    //       headers: U extends `${string}.csv` ? Array<string> : undefined
    //       accept: Record<string, string | Array<string>>
    //       match?: RegExp
    //     }> = {}
    //     ) => { return defineRepoTherapyImport<T, U>(options)() },
    //     enum: {}
    //   }

    //   const loggerCache: Record<
    //   'complete' | 'error' | 'info' | 'success' | 'warn',
    //   Array<string>
    // > = {
    //   complete: [],
    //   error: [],
    //   info: [],
    //   success: [],
    //   warn: []
    // }

    //   const definEnv = await defineRepoTherapyEnv<T>((...x) => ({
    //     typeName: startCase(libTool.project).replace(/\s/g, '') + 'Env',
    //     ...((envConfig ? envConfig(...x) : undefined) || {}),
    //     project: libTool.project
    //   }))({
    //     ...libTool,
    //     logger: Object.fromEntries(
    //       Object.keys(loggerCache).map(x => [x, (s: string) => loggerCache[
    //       x as keyof typeof loggerCache
    //       ].push(s)])
    //     ) as unknown as ReturnType<
    //     ReturnType<typeof defineRepoTherapyLogger>
    //   >['logger']
    //   })

    //   libTool.env = definEnv.env
    //   libTool.project = definEnv.env.project
    //   libTool.getOriginalEnv = definEnv.getOriginalEnv
    //   libTool.generateTypeDeclaration = definEnv.generateTypeDeclaration
    //   libTool.path.project = `./project/${libTool.project}`
    //   libTool.root.project = join(rootPath, libTool.path.project)

    //   libTool.logger = silent
    //     ? Object.fromEntries(
    //       Object.keys(loggerCache).map(x => [x, () => {}])
    //     ) as unknown as ReturnType<
    //     ReturnType<typeof defineRepoTherapyLogger>
    //   >['logger']
    //     : logger(libTool).logger

    //   if (!silent) {
    //     Object.entries(loggerCache).forEach(([k, v]) => {
    //       if (v.length === 0) { return }
    //       v.forEach(s => {
    //         libTool.logger[k as keyof typeof libTool.logger](s)
    //       })
    //     })
    //   }

    //   const serverResponse = Object.entries(
    //     defaultServerCodes
    //   ).flatMap(([category, x]) => {
    //     return Object.entries(x as Record<string
    // , RepoTherapyUtil.ServerCodeInfo>)
    //       .map(([name, { statusCode, defaultMessage }]) => {
    //         const customValue = serverCode[category] && (serverCode[
    //           category
    //         ] as Record<string, RepoTherapyUtil.ServerCodeInfo>)[name]
    //         return [statusCode, {
    //           name,
    //           category,
    //           isError: (customValue?.statusCode || statusCode) >= 400,
    //           defaultMessage: (customValue?.defaultMessage || defaultMessage)
    //         }] as [number, RepoTherapyUtil.ServerCodeConfig]
    //       })
    //   })

    //   const errorList = Object.fromEntries(([
    //     ...Object.entries(error),
    //     ...serverResponse.filter(([, v]) => v.isError)
    //       .map(([code, x]) => [x.name, { ...x, code }])
    //   ] as Array<[
    //   string,
    //   string | RepoTherapyUtil.ServerCodeConfig & { code: number }
    // ]>).map(([name, x]) => {
    //     if (typeof x === 'string') {
    //       return [
    //         name,
    //         defineRepoTherapyError({ name, defaultMessage: x })()
    //       ]
    //     }
    //     return [name, defineRepoTherapyError({
    //       name,
    //       defaultMessage: x.defaultMessage,
    //       defaultProp: x
    //     })]
    //   }))

    //   let packageManager: RepoTherapy.PackageManager = 'yarn'
    //   try {
    //     await libTool.import().importScript('package-lock.json')
    //       .then(x => x.import)
    //     packageManager = 'npm'
    //   } catch {
    //     try {
    //       await defineRepoTherapyImport()()
    //         .importScript('pnpm-lock.yaml')
    //         .then(x => x.import)
    //       packageManager = 'pnpm'
    //     } catch {}
    //   }

    //   let _framework: Array<RepoTherapy.Framework> | undefined = framework
    //   const frameworkList: Record<
    //   RepoTherapy.ProjectType,
    //   Array<RepoTherapy.Framework>
    // > = {
    //   frontend: ['nuxt.js', 'angular', 'svelte', 'vue.js', 'nuxt-monorepo'],
    //   backend: ['next.js', 'serverless', 'dynamodb', 'knexpresso'],
    //   'npm-lib': []
    // }

    //   const packageJsonCache = await defineRepoTherapyPackageJson(
    //     { projectType: _projectType || 'npm-lib', packageManager }
    //   )(libTool)
    //   if (!_projectType || !_framework) {
    //     const dependencies = Object.keys
    // (packageJsonCache.json.dependencies || {})
    //     if (!_projectType) {
    //       _projectType = (Object.entries
    // (frameworkList).find(x => dependencies.find(
    //         y => x[1].includes(y as RepoTherapy.Framework)
    //       ))?.[0] || 'npm-lib') as RepoTherapy.ProjectType
    //     }
    //     if (!_framework) {
    //       _framework = Object.entries(frameworkList)
    //         .flatMap(x => dependencies.filter(
    //           y => x[1].includes(y as RepoTherapy.Framework)
    //         )) as Array<RepoTherapy.Framework>
    //     }
    //   }

    //   async function init () {
    //     await defineRepoTherapyPackageJson(
    //       { projectType: _projectType, packageManager }
    //     )(libTool).then(x => x.write())
    //     await defineRepoTherapyGitignore({ framework: _framework })(libTool)
    //       .then(x => x.write())
    //     await defineRepoTherapyTsconfig
    // ({ projectType: _projectType })(libTool)
    //       .then(x => x.write())
    //     await defineRepoTherapyVsCode({
    //       packageManager,
    //       framework: _framework
    //     })(libTool).then(x => x.write())
    //     defineRepoTherapyHusky({ packageManager })(libTool).setup()
    //   }

    //   await libTool.import().importScript
    // ('package-lock.json').then(x => x.import)
    //   await defineRepoTherapyImport()()
    //     .importScript('pnpm-lock.yaml')
    //     .then(x => x.import)

    //   return {
    //     ...libTool,
    //     init,
    //     serverCode: Object.fromEntries(serverResponse),
    //     error: errorList,
    //     newError: defineRepoTherapyError,
    //     lint: () => defineRepoTherapyLint()(libTool),
    //     json: defineRepoTherapyJson,
    //     packageJson: packageJsonCache,
    //     isLocal: !['production', 'staging', 'de
    // v'].includes(libTool.env.nodeEnv)
    //   }
    return r
  })
}
