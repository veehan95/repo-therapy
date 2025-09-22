import { join } from 'path'
import { writeFileSync } from 'fs'
import { defineRepoTherapyWrapper as wrapper } from './wrapper'
import { baseGitignore, frameworkGitignore } from '../config/gitignore'

export const f: typeof defineRepoTherapyGitignore = (
  options = {}
) => wrapper('define-gitignore', async (libTool) => {
  const path = options.path || '.gitignore'

  const currentConfig = await libTool.import<string>()
    .importScript(path).then(x => x.import || '')

  const baseConfig = [
    ...Object.entries(baseGitignore).map(([k, v]) => [k, v]),
    ...Object.entries(frameworkGitignore)
      .filter(([k]) => options.framework?.includes(k as RepoTherapy.Framework))
      .map(([k, v]) => [`Framework: ${k}`, v])
  ] as Array<[string, Array<string>]>
  const defaultGitignore = Object.values(baseConfig)
    .flatMap(([, x]) => x.map(y => y.trim()))
    .filter(x => x && !/^#/.test(x))
  const existingCustomGitignore = currentConfig
    .split(/\n/g)
    .filter(
      x => x.trim() &&
        !/^#/.test(x) &&
        !defaultGitignore.includes(x.trim())
    )
  const customGitignore = options.custom
    ? options.custom(existingCustomGitignore)
    : existingCustomGitignore

  const config = [
    ...baseConfig,
    ['Custom Ignores', customGitignore]
  ] as Array<[string, Array<string>]>

  return {
    config: Object.fromEntries(config),
    path,
    write: () => {
      writeFileSync(
        join(libTool.root.root, path),
        config.map(([k, v]) => [k, v.map(x => x.trim())])
          .filter(([, v]) => v.length > 0)
          .map(([k, v]) => [
            '# ================================',
            `# ${k}`,
            '# ================================',
            ...v
          ].join('\n'))
          .join('\n\n') + '\n'
      )
    }
  }
})

export { f as defineRepoTherapyGitignore }
