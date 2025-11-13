import { type PackageJson } from 'type-fest'
import { writeFileSync } from 'node:fs'
import { defineRepoTherapyInternalWrapper as wrapper } from './wrapper'
import { defineRepoTherapyJson } from './json'
import { config as packageJsonConfig } from '../configs/package-json'

// 'define-package-json',
// [],
// Promise<{
//   path: string
//   json: import('type-fest').PackageJson.PackageJsonStandard
//   write: () => void
// }>,
// 'tool'

export function defineRepoTherapyPackageJson ({
  path,
  projectType = 'npm-lib',
  packageManager = 'yarn'
}: Partial<{
  path: string
  projectType: RepoTherapy.ProjectType
  packageManager: RepoTherapy.PackageManager
}> = {}) {
  return wrapper('define-package-json', async (libTool) => {
    const jsonPath = path || 'package.json'
    const packageJson = await libTool.import()
      .importScript(jsonPath, { soft: true })

    const config = packageJsonConfig(libTool.env, projectType, packageManager)
    const data = defineRepoTherapyJson(config)(packageJson.import || {})
      .json as PackageJson.PackageJsonStandard

    return {
      path: packageJson.fullPath,
      json: data,
      write: () => {
        writeFileSync(packageJson.fullPath, JSON.stringify(data, undefined, 2))
      }
    }
  })
}
