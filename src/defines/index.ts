import { existsSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

import { findUp } from 'find-up'
import lodash from 'lodash'

import { defineRepoTherapyCsv, type CsvOption, type RawCsvRow } from './csv'
import { defineRepoTherapyEnum, EnumDefination } from './enum'
import { defineRepoTherapyEnv } from './env'
import { defineRepoTherapyGitIgnore } from './gitignore'
import { defineRepoTherapyHusky } from './husky'
import { defineRepoTherapyImport } from './import'
// import { defineRepoTherapyLint } from './lint'
import { defineRepoTherapyLogger } from './logger'
import { defineRepoTherapyPackageJson } from './package-json'
import { defineRepoTherapyStreamSync } from './stream-sync'
import { defineRepoTherapyString } from './string'
import { defineRepoTherapyStud } from './stud'
import { defineRepoTherapyTsConfig } from './tsconfig'
import { defineRepoTherapyValue } from './value'
import {
  defineRepoTherapyValueParse,
  type ValueDefination,
  type ValueParseOptions
} from './value-parse'
import { defineRepoTherapyVsCode } from './vscode'
import { defineRepoTherapyInternalWrapper as wrapper } from './wrapper'
import {
  type ImportConfigMeta,
  type LibTool
} from '../../types/lib-tool'
import { type Util } from '../../types/repo-therapy'
import { NodeEnvOptions, PackageManager, ProjectType } from '../statics/enums'

class PathObj <RootPath extends Util.Path, LinkPath extends Util.LinkPath> {
  private _pathList: LinkPath

  private _rootPath: RootPath

  private _project = 'unknown'

  get pathList () {
    const r = {
      projectRoot: '/projects' as Util.Path,
      log: '/.log' as Util.Path,
      build: '/dist' as Util.Path,
      buildCache: '/.repo-therapy' as Util.Path,
      config: '/config',
      ...this._pathList,
      typeDeclaration: '/types' as Util.Path,
      project: '' as Util.Path,
      projectConfig: '' as Util.Path
    }
    r.project = `${r.projectRoot}/${this._project}` as Util.Path
    r.projectConfig = `${r.projectRoot}/${r.config}` as Util.Path
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

export interface RepoTherapyOptions<
  VD extends ValueDefination,
  LinkPath extends Util.LinkPath = Util.LinkPath,
  EnumConfig extends Record<
    string,
    EnumDefination
  > = Record<string, EnumDefination>,
  ImportConfig extends Record<
    string,
    ImportConfigMeta
  > = Record<string, ImportConfigMeta>,
  RootPath extends Util.Path = Util.Path
> {
  libName?: string
  project?: string
  // todo
  // description: string
  rootPath?: RootPath
  nodeEnv?: NodeEnvOptions
  linkPath?: LinkPath
  projectType?: ProjectType
  importConfig?: ImportConfig
  env?: ReturnType<typeof defineRepoTherapyEnv<VD>>
  logger?: ReturnType<typeof defineRepoTherapyLogger>
  enum?: ReturnType<typeof defineRepoTherapyEnum<EnumConfig>>
  husky?: ReturnType<typeof defineRepoTherapyHusky>
  packageJson?: ReturnType<typeof defineRepoTherapyPackageJson>
  gitignore?: ReturnType<typeof defineRepoTherapyGitIgnore>
  vsCode?: ReturnType<typeof defineRepoTherapyVsCode>
  tsConfig?: ReturnType<typeof defineRepoTherapyTsConfig>
  // lint?: ReturnType<typeof defineRepoTherapyLint>
  // projectType: RepoTherapy.ProjectType
  // framework: Array<RepoTherapy.Framework>
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
}

export function defineRepoTherapy <
  VD extends ValueDefination,
  LinkPath extends Util.LinkPath = Util.LinkPath,
  EnumConfig extends Record<
    string,
    EnumDefination
  > = object & Record<string, EnumDefination>,
  ImportConfig extends Record<
    Util.SlugCase,
    ImportConfigMeta
  > = Record<string, ImportConfigMeta>,
  RootPath extends Util.Path = Util.Path
> (options: RepoTherapyOptions<
  VD,
  LinkPath,
  EnumConfig,
  ImportConfig,
  RootPath
> = {}) {
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
      linkPath: {} as Record<'build', Util.Path> & LinkPath
    // serverCode = {},
    // error = {},
    // silent = false,
    // todo move to @types
    // manualModuleTyping = []
    }, options)

    const defaultRoot = await findUp('package.json')
    if (!optionWithDefault.linkPath.build) {
      optionWithDefault.linkPath.build = (
        optionWithDefault.projectType === ProjectType.npmLib
          ? '/bin'
          : '/dist'
      )
    }
    const pathObj = new PathObj<RootPath, LinkPath>((
      optionWithDefault.rootPath ||
      (defaultRoot ? dirname(defaultRoot) : undefined) ||
      process.cwd()
    ) as RootPath, optionWithDefault.linkPath)

    // const importConfig = {
    //   ...(options.importConfig || {}),
    //   env: {
    //     defination: ['define-repo-therapy-env'],
    //     default: defineRepoTherapyEnv<VD>
    //   },
    //   logger: {
    //     defination: ['define-repo-therapy-logger'],
    //     default: defineRepoTherapyLogger
    //   },
    //   enum: {
    //     defination: ['define-repo-therapy-enum'],
    //     default: defineRepoTherapyEnum<EnumConfig>
    //   },
    //   husky: {
    //     defination: ['define-repo-therapy-husky'],
    //     default: defineRepoTherapyHusky
    //   },
    //   'package-json': {
    //     defination: ['define-repo-therapy-package-json'],
    //     default: defineRepoTherapyPackageJson
    //   },
    //   gitignore: {
    //     defination: ['define-repo-therapy-gitignore'],
    //     default: defineRepoTherapyGitIgnore
    //   },
    //   'vs-code': {
    //     defination: ['define-repo-therapy-vscode'],
    //     default: defineRepoTherapyVsCode
    //   },
    //   'ts-config': {
    //     defination: ['define-repo-therapy-tsconfig'],
    //     default: defineRepoTherapyTsConfig
    //   },
    //   stud: {
    //     defination: ['define-repo-therapy-stud'],
    //     default: defineRepoTherapyStud
    //   }
    //   // lint: {
    //   //   defination: ['define-repo-therapy-lint'],
    //   //   default: defineRepoTherapyLint
    //   // }
    // } as Record<keyof ImportConfig, ImportConfigMeta> &
    //   DefaultImportConfig<VD, EnumConfig>

    const libTool = {
      libName: options.libName || 'RepoTherapy',
      projectType: optionWithDefault.projectType,
      possibleProject: readdirSync(pathObj.absolutePath.projectRoot),
      packageManager: PackageManager.NPM,
      absolutePath: pathObj.absolutePath,
      path: pathObj.pathList,
      getChildPath: (parent, path, { absolute } = {}) => join(
        (absolute ? pathObj.absolutePath : pathObj.pathList)[parent] || '',
        path
      ) as Util.Path,
      streamSync: (stream, option) => defineRepoTherapyStreamSync(
        stream,
        option
      )(),
      valueParser: <T extends ValueDefination> (
        defination: T,
        option?: ValueParseOptions
      ) => defineRepoTherapyValueParse(defination, option)(),
      value,
      string: () => defineRepoTherapyString()(),
      importConfig: {
        ...(options.importConfig || {}),
        env: {
          defination: ['define-repo-therapy-env'],
          default: defineRepoTherapyEnv<VD>
        },
        logger: {
          defination: ['define-repo-therapy-logger'],
          default: defineRepoTherapyLogger
        },
        enum: {
          defination: ['define-repo-therapy-enum'],
          default: defineRepoTherapyEnum<EnumConfig>
        },
        husky: {
          defination: ['define-repo-therapy-husky'],
          default: defineRepoTherapyHusky
        },
        'package-json': {
          defination: ['define-repo-therapy-package-json'],
          default: defineRepoTherapyPackageJson
        },
        gitignore: {
          defination: ['define-repo-therapy-gitignore'],
          default: defineRepoTherapyGitIgnore
        },
        'vs-code': {
          defination: ['define-repo-therapy-vscode'],
          default: defineRepoTherapyVsCode
        },
        'ts-config': {
          defination: ['define-repo-therapy-tsconfig'],
          default: defineRepoTherapyTsConfig
        },
        stud: {
          defination: ['define-repo-therapy-stud'],
          default: defineRepoTherapyStud
        }
        // lint: {
        //   defination: ['define-repo-therapy-lint'],
        //   default: defineRepoTherapyLint
        // }
      }
    // todo fix as
    } as LibTool<VD, LinkPath, EnumConfig, ImportConfig, RootPath>

    libTool.importLib = defineRepoTherapyImport()(libTool)

    libTool.importLibFromArray = <
      T,
      U extends Util.DirImport = Util.DirImport
    > (
        dir: Array<U| string>,
        callback: (options: U) => Promise<Array<Util.ImportScriptDir<T>>>
      ) => {
      const dirParsed = dir.map(
        path => typeof path === 'string' ? { path } : path
      ) as Array<U>
      async function getResult () {
        const x = [] as Array<{ options: U } & Util.ImportScriptDir<T>>
        for (const i in dirParsed) {
          const p = dirParsed[i].absolute
            ? dirParsed[i].path
            : libTool.getChildPath('root', dirParsed[i].path)
          if (existsSync(p)) {
            x.push(...(await callback(dirParsed[i])).map(
              x => ({ options: dirParsed[i], ...x })
            ))
          }
        }
        return x
      }
      const result = getResult()
      return {
        result,
        loop: async <Z = undefined> (
          loopCallback: (x: Awaited<typeof result>[number]) => Z | Promise<Z>
        ) => {
          const x = await result
          const r: Array<{
            result: Z
            options: U
          } & Util.ImportScriptDir<T>> = []
          for (const i in x) {
            r.push({ result: await loopCallback(x[i]), ...x[i] })
          }
          return r
        }
      }
    }

    libTool.optionOrFile = (async (k) => {
      const { defination, default: defaultFunc } = libTool.importConfig[k]
      return options[k as keyof typeof options] || await libTool.importLib
        .importScript(
          libTool.getChildPath('configs', `${k.toString()}.ts`),
          { accept: { default: defination }, soft: true }
        ).then(x => x.import?.default) || defaultFunc()
    }) as typeof libTool.optionOrFile

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

    const envParser = await (await libTool.optionOrFile('env'))(libTool)({
      project: optionWithDefault.project,
      nodeEnv: optionWithDefault.nodeEnv,
      skip: skipEnv
    })
    libTool.env = envParser.get()
    libTool.generateEnv = envParser.generate

    const logger = (await libTool.optionOrFile('logger'))(libTool)
    libTool.logger = logger.logger
    libTool.loggerPrint = logger.printString

    libTool.csv = <
      RowType,
      RawRowType extends RawCsvRow<object> = RawCsvRow<RowType>
    >(option: CsvOption<RowType, RawRowType>) => defineRepoTherapyCsv<
      RowType,
      RawRowType
    >(option)(libTool)

    const enumsAwait = await (await libTool.optionOrFile('enum'))(libTool)
    libTool.enum = enumsAwait.enum
    libTool.enumKeys = enumsAwait.availableKey

    const huskyAwait = await libTool.optionOrFile('husky')
    libTool.husky = () => huskyAwait(libTool)

    // todo parameter dont throw error for wrong string
    const packageJsonAwait = await libTool.optionOrFile('package-json')
    libTool.packageJson = () => packageJsonAwait(libTool)

    const gitignoreAwait = await libTool.optionOrFile('gitignore')
    libTool.gitignore = () => gitignoreAwait(libTool)

    const vscodeAwait = await libTool.optionOrFile('vs-code')
    libTool.vsCode = () => vscodeAwait(libTool)

    const tsConfigAwait = await libTool.optionOrFile('ts-config')
    libTool.tsConfig = () => tsConfigAwait(libTool)

    const studAwait = await libTool.optionOrFile('stud')
    libTool.stud = () => studAwait(libTool)

    return libTool
  }

  return wrapper<typeof r, undefined, false>('', () => r)
}
