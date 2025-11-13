import { dirname, join } from 'node:path'
import lodash from 'lodash'
import { findUp } from 'find-up'
import { type Util } from '../types/repo-therapy'
import { defineRepoTherapyImport } from './import'
import { defineRepoTherapyLogger } from './logger'
import { defineRepoTherapyInternalWrapper as wrapper } from './wrapper'
import { defineRepoTherapyEnv, type EnvCallback } from './env'
import {
  defineRepoTherapyCsv,
  type Option as CsvOption,
  type RawCsvRow
} from './csv'
import {
  defineRepoTherapyValueParse,
  type Option as ValueParseOption,
  type ValueDefination
} from './value-parse'
import { defineRepoTherapyValue } from './value'
import { defineRepoTherapyStreamSync } from './stream-sync'
import { type LibTool } from '../types/lib-tool'
import { defineRepoTherapyHusky } from './husky'

class PathObj <RootPath extends Util.Path, LinkPath extends Util.LinkPath> {
  private _pathList: LinkPath

  private _rootPath: RootPath

  private _project = 'unknown'

  get pathList () {
    const r = {
      projectRoot: '/project' as Util.Path,
      ...this._pathList,
      build: '/dist' as Util.Path,
      husky: '/.husky' as Util.Path,
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

  constructor (rootPath: RootPath, pathList: LinkPath) {
    this._rootPath = rootPath
    this._pathList = pathList
  }
}

function value (description: string | Array<string>) {
  return defineRepoTherapyValue(description)()
}

export async function defineRepoTherapy <
  VD extends ValueDefination,
  RootPath extends Util.Path = Util.Path,
  LinkPath extends Util.LinkPath = Util.LinkPath
> ({
  project,
  // projectType = 'npm-lib',
  // framework,
  rootPath: basePath,
  linkPath = {} as LinkPath,
  logger: loggerFunc,
  env,
  envInterfaceName,
  envSkip = false
  // serverCode = {},
  // error = {},
  // silent = false,
  // todo move to @types
  // manualModuleTyping = []
}: Partial<{
  project: string
  rootPath: RootPath
  linkPath: LinkPath
  // projectType: RepoTherapy.ProjectType
  // framework: Array<RepoTherapy.Framework>
  logger: ReturnType<typeof defineRepoTherapyLogger>
  env?: EnvCallback<VD>
  envInterfaceName?: string
  envSkip?: boolean
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
}> = {}) {
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

  const defaultRoot = await findUp('package.json')
  const pathObj = new PathObj<RootPath, LinkPath>((
    basePath ||
    (defaultRoot ? dirname(defaultRoot) : undefined) ||
    process.cwd()
  ) as RootPath, linkPath)

  type LibToolType = LibTool<VD, RootPath, LinkPath>
  const libTool: LibToolType = {
    packageManager: 'npm',
    // todo fix as
    absolutePath: pathObj.absolutePath as LibToolType['absolutePath'],
    path: pathObj.pathList,
    importLib: undefined as unknown as LibToolType['importLib'],
    env: undefined as unknown as LibToolType['env'],
    generateEnv: undefined as unknown as LibToolType['generateEnv'],
    logger: undefined as unknown as LibToolType['logger'],
    loggerPrint: undefined as unknown as LibToolType['loggerPrint'],
    csv: undefined as unknown as LibToolType['csv'],
    husky: undefined as unknown as LibToolType['husky'],
    streamSync: (stream, option) => defineRepoTherapyStreamSync(
      stream,
      option
    )(),
    valueParser: <T extends ValueDefination> (
      defination: T,
      option: ValueParseOption
    ) => defineRepoTherapyValueParse(defination, option)(),
    value
  }

  libTool.importLib = await defineRepoTherapyImport()(libTool)

  if (
    (await libTool.importLib.importScript('/yarn.lock', { soft: true })).import
  ) { libTool.packageManager = 'yarn' }
  if (
    (await libTool.importLib.importScript('/pnpm-lock.yaml', { soft: true }))
      .import
  ) { libTool.packageManager = 'pnpm' }
  if (
    (await libTool.importLib.importScript('/bun.lockb', { soft: true })).import
  ) { libTool.packageManager = 'bun' }

  const envParser = await defineRepoTherapyEnv<VD>(env, {
    project,
    interfaceName: envInterfaceName,
    skip: envSkip
  })(libTool)
  libTool.env = envParser.get()
  libTool.generateEnv = envParser.generate

  const logger = (loggerFunc || defineRepoTherapyLogger())(libTool)
  libTool.logger = logger.logger
  libTool.loggerPrint = logger.printString

  libTool.csv = <
    RowType,
    RawRowType extends RawCsvRow<object> = RawCsvRow<RowType>
  >(option: CsvOption<RowType, RawRowType>) => defineRepoTherapyCsv<
    RowType,
    RawRowType
  >(option)(libTool)

  libTool.husky = () => defineRepoTherapyHusky()(libTool)

  return wrapper('define-repo-therapy', () => {
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
    return libTool
  })
}
