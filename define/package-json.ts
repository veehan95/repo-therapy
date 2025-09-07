import { type PackageJson } from 'type-fest'
import { writeFileSync } from 'fs'
import { defineRepoTherapyWrapper as wrapper } from './wrapper'
import { defineRepoTherapyImport } from './import'
import { defineRepoTherapyJson } from './json'
import { config as packageJsonConfig } from '../config/package-json'

const f: typeof defineRepoTherapyPackageJson = ({
  path,
  projectType = 'npm-lib',
  packageManager = 'yarn'
} = {}) => wrapper('define-package-json', async ({ env }) => {
  const jsonPath = path || 'package.json'
  const packageJson = await defineRepoTherapyImport()()
    .importScript(jsonPath, { soft: true })

  const config = packageJsonConfig(env, projectType, packageManager)
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

export { f as defineRepoTherapyPackageJson }
