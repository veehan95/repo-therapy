import { type Transform, type Writable } from 'stream'

import { defineRepoTherapyWrapper } from 'src'
import { defineRepoTherapyStud } from 'src/defines/stud'
import { defineRepoTherapyTsConfig } from 'src/defines/tsconfig'
import { defineRepoTherapyVsCode } from 'src/defines/vscode'
import { type PackageJson } from 'type-fest'

import { type Util } from './repo-therapy.d'
import {
  defineRepoTherapyCsv,
  type CsvOption,
  type RawCsvRow
} from '../src/defines/csv'
import { defineRepoTherapyEnum, EnumDefination } from '../src/defines/enum'
import { defineRepoTherapyEnv } from '../src/defines/env'
import { defineRepoTherapyGitIgnore } from '../src/defines/gitignore'
import { defineRepoTherapyHusky } from '../src/defines/husky'
import { defineRepoTherapyImport } from '../src/defines/import'
import { defineRepoTherapyLogger } from '../src/defines/logger'
import { defineRepoTherapyPackageJson } from '../src/defines/package-json'
import {
  defineRepoTherapyStreamSync,
  type StreamSyncOptions
} from '../src/defines/stream-sync'
import { defineRepoTherapyString } from '../src/defines/string'
import { defineRepoTherapyValue } from '../src/defines/value'
import {
  defineRepoTherapyValueParse,
  type ValueDefination,
  type ValueParseOptions
} from '../src/defines/value-parse'
import { PackageManager, ProjectType } from '../src/statics/enums'

type LinkPathPredefined <PO extends Util.LinkPath> = {
  projectRoot: Util.Path
  buildCache: Util.Path
  config: Util.Path
  log: Util.Path
  build: Util.Path
  typeDeclaration: Util.Path
  project: Util.Path
  projectConfig: Util.Path
} & PO

type ImportConfigPredefined = 'env' | 'logger' | 'enum' | 'husky' |
  'packageJson' | 'gitignore' | 'vsCode' | 'tsConfig' | 'lint'

export interface ImportConfigMeta <
  K extends (
    ...args: Array<Util.GenericType>
  ) => ReturnType<typeof defineRepoTherapyWrapper> = (
    ...args: Array<Util.GenericType>
  ) => ReturnType<typeof defineRepoTherapyWrapper>
> {
  defination: Array<string>
  default: K
}

export type DefaultImportConfig <
  VD extends ValueDefination,
  EnumConfig extends Record<
    string,
    EnumDefination
  > = object & Record<string, EnumDefination>
> = {
  env: defineRepoTherapyEnv<VD>
  logger: defineRepoTherapyLogger
  enum: defineRepoTherapyEnum<EnumConfig>
  husky: defineRepoTherapyHusky
  'package-json': defineRepoTherapyPackageJson
  gitignore: defineRepoTherapyGitIgnore
  'vs-code': defineRepoTherapyVsCode
  'ts-config': defineRepoTherapyTsConfig
  stud: defineRepoTherapyStud
}

type ImportConfigFull <
  T extends Record<Util.SlugCase, ImportConfigMeta>,
  VD extends ValueDefination,
  EnumConfig extends Record<
    string,
    EnumDefination
  > = object & Record<string, EnumDefination>
> = T & {
  [
    key in keyof DefaultImportConfig<VD, EnumConfig>
  ]: ImportConfigMeta<DefaultImportConfig<VD, EnumConfig>[K]>
}

export interface LibTool <
  VD extends ValueDefination = ValueDefination,
  LinkPath extends Util.LinkPath = Util.LinkPath,
  EnumConfig extends Record<
    string,
    EnumDefination
  > = object,
  ImportConfig extends Record<
    Util.SlugCase,
    ImportConfigMeta
  > = Record<Util.SlugCase, ImportConfigMeta>,
  RootPath extends Util.Path = Util.Path,
  LibToolImportConfig extends ImportConfigFull<
    ImportConfig,
    VD,
    EnumConfig
  > = ImportConfigFull<ImportConfig, VD, EnumConfig>,
  LibToolLinkPath extends LinkPathPredefined<
    LinkPath
  > = LinkPathPredefined<LinkPath>
> {
  libName: string
  projectType: ProjectType
  possibleProject: Array<string>
  packageManager: PackageManager
  absolutePath: { root: RootPath } & LibToolLinkPath
  path: LibToolLinkPath
  getChildPath: <T extends `${string}${
    NodeJavaScriptExt | NodeTypeScriptExt | '.json'
  }` | string> (
    parent: keyof LibToolLinkPath | 'root',
    path: T,
    options?: { absolute?: boolean }
  ) => T extends `${string}${NodeJavaScriptExt | NodeTypeScriptExt}`
    ? Util.ScriptPath
    : T extends `${string}.json` ? Util.JsonPath : Util.Path
  importLib: Awaited<ReturnType<ReturnType<typeof defineRepoTherapyImport>>>
  importLibFromArray: <T, U extends Util.DirImport = Util.DirImport> (
    dir: Array<U | string>,
    callback: (options: U) => Promise<Array<Util.ImportScriptDir<T>>>
  ) => {
    result: Promise<Array<{ options: U } & Util.ImportScriptDir<T>>>
    loop: <Z = undefined>(
      loopCallback: (x: { options: U } & Util.ImportScriptDir<T>) => Z
    ) => Promise<Array<{
      result: Z
      options: U
    } & Util.ImportScriptDir<T>>>
  }
  importConfig: LibToolImportConfig
  optionOrFile: (k: keyof LibToolImportConfig) => Promise<
    ReturnType<LibToolImportConfig[K]['default']>
  >
  env: ReturnType<Awaited<
    ReturnType<ReturnType<typeof defineRepoTherapyEnv<VD>>>
  >['get']>
  generateEnv: Awaited<
    ReturnType<ReturnType<ReturnType<typeof defineRepoTherapyEnv<VD>>>>
  >['generate']
  logger: ReturnType<ReturnType<typeof defineRepoTherapyLogger>>['logger']
  loggerPrint: ReturnType<
    ReturnType<typeof defineRepoTherapyLogger>
  >['printString']
  csv: <
    RowType,
    RawRowType extends RawCsvRow<object> = RawCsvRow<RowType>
  > (option: CsvOption<RowType, RawRowType>) => ReturnType<ReturnType<
    typeof defineRepoTherapyCsv<RowType, RawRowType>
  >>
  husky: () => ReturnType<ReturnType<typeof defineRepoTherapyHusky>>
  packageJson: (
    config: Partial<PackageJson> = {}
  ) => ReturnType<ReturnType<typeof defineRepoTherapyPackageJson>>
  streamSync: (
    stream: Transform | Writable,
    option?: StreamSyncOptions
  ) => ReturnType<ReturnType<typeof defineRepoTherapyStreamSync>>
  valueParser: <T extends ValueDefination> (
    defination: T,
    option?: ValueParseOptions
  ) => ReturnType<ReturnType<typeof defineRepoTherapyValueParse>>
  value: (description: string | Array<string>) => ReturnType<
    ReturnType<typeof defineRepoTherapyValue>
  >
  string: () => ReturnType<ReturnType<typeof defineRepoTherapyString>>
  enum: Awaited<ReturnType<
    ReturnType<typeof defineRepoTherapyEnum<EnumConfig>>
  >>['enum']
  enumKeys: Awaited<ReturnType<
    ReturnType<typeof defineRepoTherapyEnum<EnumConfig>>
  >>['availableKey']
  gitignore: () => ReturnType<ReturnType<typeof defineRepoTherapyGitIgnore>>
  vsCode: () => ReturnType<ReturnType<typeof defineRepoTherapyVsCode>>
  tsConfig: () => ReturnType<ReturnType<typeof defineRepoTherapyTsConfig>>
  stud: () => ReturnType<ReturnType<typeof defineRepoTherapyStud>>
}
