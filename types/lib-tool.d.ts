import { type Transform, type Writable } from 'stream'
import { defineRepoTherapyImport } from '../defines/import'
import { defineRepoTherapyEnv } from '../defines/env'
import { defineRepoTherapyLogger } from '../defines/logger'
import { defineRepoTherapyCsv } from '../defines/csv'
import {
  defineRepoTherapyStreamSync,
  type Option as StreamSyncOption
} from '../defines/stream-sync'
import {
  defineRepoTherapyValueParse,
  type Option as ValueParseOption,
  type ValueDefination
} from '../defines/value-parse'
import { defineRepoTherapyValue } from '../defines/value'
import { Util } from './repo-therapy.d'
import { defineRepoTherapyHusky } from 'defines/husky'

type LinkPathPredefined <PO extends Util.LinkPath> = {
  projectRoot: Util.Path
  build: Util.Path
  husky: Util.Path
  typeDeclaration: Util.Path
  project: Util.Path
} & PO

export interface LibTool <
  VD extends ValueDefination = ValueDefination,
  RootPath extends Path = Path,
  PathObject extends Util.LinkPath = Util.LinkPath
> {
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun'
  absolutePath: { root: RootPath } & LinkPathPredefined<PathObject>
  path: LinkPathPredefined<PathObject>
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
  streamSync: (
    stream: Transform | Writable,
    option?: StreamSyncOption
  ) => ReturnType<ReturnType<typeof defineRepoTherapyStreamSync>>
  valueParser: <T extends ValueDefination> (
    defination: T,
    option: ValueParseOption
  ) => ReturnType<ReturnType<typeof defineRepoTherapyValueParse>>
  value: (description: string | Array<string>) => ReturnType<
    ReturnType<typeof defineRepoTherapyValue>
  >
}
