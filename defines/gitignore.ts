import { startCase } from 'lodash'
import { defineRepoTherapyInternalWrapper as wrapper } from './wrapper'

export interface GitignoreOptions {
  ignores?: Array<string>
}

export function defineRepoTherapyGitIgnore (
  options: GitignoreOptions = {}
) {
  return wrapper('gitignore', (libTool) => {
    async function getPath () {
      return await libTool
        .importLib
        .importStatic('/.gitignore', { soft: true })
    }

    async function get (option: { clean?: boolean } = {}) {
      const currentConfigImport = await getPath()

      const chunk = Object.entries({
        General: libTool.enum.GitIgnore,
        PackageManager: {
          [libTool.packageManager]: libTool.enum.GitIgnorePackageManager[
            libTool.packageManager
          ]
        },
        Custom: { Settings: options.ignores?.join('\n') || '' }
      }).reduce((acc, [section, data]) => {
        Object.entries(data).forEach(([name, content]) => {
          acc.push({
            title: `${startCase(section)}: ${startCase(name)}`,
            content: content.split(/\r|\n/)
          })
        })
        return acc
      }, [] as Array<{
        title: string
        content: Array<string>
      }>)

      const chunkContent = chunk.flatMap(x => x.content)
      // todo framwork
      chunk.push({
        title: 'Custom: Not via setting',
        content: (currentConfigImport.import || '')
          .split(/\r|\n/g)
          .filter(x => x && !/^# /.test(x) && !chunkContent.includes(x))
      })

      return {
        path: currentConfigImport.path,
        fullPath: currentConfigImport.fullPath,
        status: currentConfigImport.import
          ? libTool.enum.GenerateStatus.updated
          : libTool.enum.GenerateStatus.created,
        content: libTool.string().toScript(
          chunk.flatMap(r => [
            ...(option.clean
              ? []
              : [
                  '# ================================',
                  `# ${r.title.replace(/ N /g, ' & ')}`,
                  '# ================================'
                ]),
            ...r.content,
            ...(option.clean ? [] : [''])
          ])
        )
      }
    }

    return {
      get: (option: { clean?: boolean } = {}) => get(option)
        .then(x => x.content),
      getAsArray: () => get({ clean: true })
        .then(x => x.content.split('\n').filter(r => r)),
      generate: async () => {
        const r = await get()
        return await libTool.importLib.writeStatic(r.path, () => r.content)
      }
    }
  })
}
