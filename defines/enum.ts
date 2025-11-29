import { Util } from 'types/repo-therapy'

import { defineRepoTherapyInternalWrapper as wrapper } from './wrapper'
import * as defaultEnums from '../statics/enums'

export type EnumDefination = Record<string, 'string' | 'number'>

type ReverseEnumConfig <T extends Record<string, EnumDefination>> = {
  [Namespace in keyof T]: {
    [K in keyof T[Namespace]]: T[Namespace][K] extends 'number'
      ? number
      : string
  }
}

export function defineRepoTherapyEnum <
  EnumConfig extends Record<string, EnumDefination>
> (enumPaths: Array<Util.ScriptPath | {
  path: Util.ScriptPath
  absolute?: boolean
}> = [], config: EnumConfig = {} as EnumConfig) {
  const fullConfig = {
    ...config,
    ...defaultEnums
  }

  return wrapper('string', async ({ importLib }) => {
    const paths = [
      ...enumPaths.map(path => typeof path === 'string' ? { path } : path)
    ]

    let enumObj: ReverseEnumConfig<
      typeof fullConfig
    > = {} as ReverseEnumConfig<typeof fullConfig>
    for (const i in paths) {
      const enumFs = await importLib.importNodeScript(paths[i].path, {
        soft: true,
        absolute: paths[i].absolute
      })
      if (!enumFs.import) { continue }
      enumObj = Object.assign(enumObj, enumFs.import)
    }

    // todo allow overwrite
    enumObj = Object.assign(enumObj, defaultEnums)

    return {
      enum: enumObj,
      availableKey: Object.keys(fullConfig)
    }
  })
}
