import { defineRepoTherapyVsCode } from 'defines/vscode'
import { type Transform, type Writable } from 'stream'
import { type PackageJson } from 'type-fest'
import { defineRepoTherapyCsv } from '../defines/csv'
import { defineRepoTherapyEnum, EnumDefination } from '../defines/enum'
import { defineRepoTherapyEnv } from '../defines/env'
import { defineRepoTherapyGitIgnore } from '../defines/gitignore'
import { defineRepoTherapyHusky } from '../defines/husky'
import { defineRepoTherapyImport } from '../defines/import'
import { defineRepoTherapyLogger } from '../defines/logger'
import { defineRepoTherapyPackageJson } from '../defines/package-json'
import {
  defineRepoTherapyStreamSync,
  type StreamSyncOptions
} from '../defines/stream-sync'
import { defineRepoTherapyString } from '../defines/string'
import { defineRepoTherapyValue } from '../defines/value'
import {
  defineRepoTherapyValueParse,
  type ValueDefination,
  type ValueParseOptions
} from '../defines/value-parse'
import { PackageManager, ProjectType } from '../enums'
import { Util } from './repo-therapy.d'

type LinkPathPredefined <PO extends Util.LinkPath> = {
  projectRoot: Util.Path
  buildCache: Util.Path
  build: Util.Path
  typeDeclaration: Util.Path
  project: Util.Path
} & PO

export interface LibTool <
  VD extends ValueDefination = ValueDefination,
  LinkPath extends Util.LinkPath = Util.LinkPath,
  EnumConfig extends Record<
    string,
    EnumDefination
  > = object,
  RootPath extends Util.Path = Util.Path
> {
  projectType: ProjectType
  packageManager: PackageManager
  absolutePath: { root: RootPath } & LinkPathPredefined<LinkPath>
  path: LinkPathPredefined<LinkPath>
  importLib: Awaited<ReturnType<ReturnType<typeof defineRepoTherapyImport>>>
  env: ReturnType<Awaited<
    ReturnType<ReturnType<typeof defineRepoTherapyEnv<VD>>>
  >['get']>
  generateEnv: Awaited<
    ReturnType<ReturnType<typeof defineRepoTherapyEnv<VD>>>
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
}
