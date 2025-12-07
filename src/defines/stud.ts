import { basename, dirname, extname } from 'node:path'

import { defineRepoTherapyInternalWrapper as wrapper } from './wrapper'
import { type CallableValue, resolveCallableValue } from '../../src/util'
import { type Util } from '../../types/repo-therapy'

interface StudOption <T extends string = string> {
  variables?: Record<Util.Path, {
    variant?: Array<T>
    ignore?: string | false
    variantFilePath?: (path: Util.Path, variant: T) => {
      path: Util.Path
      ignorePattern: string
    }
    values: Record<string, Util.GenericType> | (
      (variant: T) => Record<string, Util.GenericType>
    )
  }>
  dirs?: Array<Util.DirImport | Util.Path>
}

export function defineRepoTherapyStud (
  options: CallableValue<StudOption> = {}
) {
  return wrapper('stud', (libTool) => {
    function getConfig () {
      const customOptions = resolveCallableValue<StudOption>(options, libTool)

      if (!customOptions.dirs) { customOptions.dirs = [] }
      customOptions.dirs.push('/studs')

      const projectRootRegexp = new RegExp(`^${libTool.path.projectRoot}`)

      return libTool.importLibFromArray<string>(
        customOptions.dirs,
        ({ path, ...o }) => libTool.importLib.importStaticFromDir(path, o)
      ).loop(source => {
        if (!/\.stud$/.test(source.relativePath)) { return }
        const ext = extname(source.relativePath)
        const basePath = source.relativePath.slice(0, -ext.length) as Util.Path
        const { variant, variantFilePath, values } = customOptions.variables
          ?.[basePath] || {}
        function createFile (variant: string = '') {
          let path = basePath
          let ignorePattern: string = basePath
          if (variant) {
            if (variantFilePath) {
              ({ path, ignorePattern } = variantFilePath(path, variant))
            } else if (
              projectRootRegexp.test(path) &&
              libTool.possibleProject.includes(variant)
            ) {
              if (variant !== libTool.env.project) { return undefined }
              path = `${libTool.path.projectRoot}/${variant}${
                path.replace(projectRootRegexp, '')
              }`
              ignorePattern = `${libTool.path.projectRoot}/**${
                ignorePattern.replace(projectRootRegexp, '')
              }`
            } else {
              const sourceExt = extname(basePath)
              const sourceBasePath = basePath
                .slice(0, -sourceExt.length) as Util.Path
              path = `${sourceBasePath}.${variant}${sourceExt}`
              ignorePattern = `${sourceBasePath}.*${sourceExt}`
            }
          }
          return {
            path,
            ignorePattern,
            values: typeof values === 'function' ? values(variant) : values
          }
        }
        if (variant) {
          return variant.map(x => createFile(x))
        } else { return [createFile()] }
      }).then(x => x.flatMap(
        ({ result, ...source }) => result
          ?.filter(rowResult => rowResult)
          ?.map(rowResult => ({ ...rowResult, source }))
      ))
    }

    return {
      getConfig,
      generate: async () => {
        const studData = await getConfig()
        return studData.map(row => {
          if (!row || !row.path || !row.source.import) { return {} }
          return libTool.importLib
            .writeStatic(row.path, () => libTool
              .string()
              .mustacheReplace(row.source.import, {
                // todo generate all not selected projects
                env: libTool.env,
                custom: row.values
              })
            )
        })
      }
    }
  })
}
