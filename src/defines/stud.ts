import { extname } from 'node:path'

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

      return libTool.importLibFromArray<string>(
        customOptions.dirs,
        ({ path, ...o }) => libTool.importLib.importStaticFromDir(path, o)
      ).loop(source => {
        if (!/\.stud$/.test(source.relativePath)) { return }

        const projectRootRegexp = new RegExp(`^${libTool.path.projectRoot}`)

        function defaultVariantFilePath (path: Util.Path, variant: string) {
          if (
            projectRootRegexp.test(path) &&
            libTool.possibleProject.includes(variant)
          ) {
            if (variant !== libTool.env.project) { return undefined }
            return {
              path: `${libTool.path.projectRoot}/${variant}${
                path.replace(projectRootRegexp, '')
              }` as Util.Path,
              ignorePattern: `${libTool.path.projectRoot}/**${
                basePath.replace(projectRootRegexp, '')
              }`
            }
          }
          const sourceExt = extname(basePath)
          const sourceBasePath = basePath
            .slice(0, -sourceExt.length) as Util.Path
          return {
            path: `${sourceBasePath}.${variant}${sourceExt}` as Util.Path,
            ignorePattern: `${sourceBasePath}.*${sourceExt}`
          }
        }

        const ext = extname(source.relativePath)
        const basePath = source.relativePath.slice(0, -ext.length) as Util.Path
        const {
          variant,
          variantFilePath = defaultVariantFilePath,
          values
        } = customOptions.variables?.[basePath] || {}
        function createFileMeta (variant: string = '') {
          let path = basePath
          let ignorePattern: string = basePath
          if (variant) {
            console.log(variant)
            const r = variantFilePath(path, variant)
            if (!r) { return }
            ({ path, ignorePattern } = r)
          }
          return {
            path,
            ignorePattern,
            values: typeof values === 'function' ? values(variant) : values
          }
        }
        if (variant) {
          return variant.map(x => createFileMeta(x))
        } else { return [createFileMeta()] }
      }).then(x => x.flatMap(({ result, ...source }) => {
        return result
          ?.filter(rowResult => rowResult)
          ?.map(rowResult => ({ ...rowResult, source }))
      }))
    }

    async function generateSingle (
      path: Util.Path,
      stud: string,
      values: object = {}
    ) {
      return await libTool.importLib.writeStatic(
        path,
        () => libTool.string().mustacheReplace(stud, {
          // todo generate all not selected projects
          env: libTool.env,
          custom: values
        })
      )
    }

    return {
      getConfig,
      generateSingle,
      generate: async () => {
        const studData = await getConfig()
        const result: Array<
          Awaited<ReturnType<typeof libTool.importLib.writeStatic>>
        > = []
        for (let i = 0; i < studData.length; i++) {
          const stud = studData[i]
          if (!stud || !stud.path || !stud.source.import) { continue }
          result.push(
            await generateSingle(stud.path, stud.source.import, stud.values)
          )
        }
        return result
      }
    }
  })
}
