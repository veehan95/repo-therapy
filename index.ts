import { gitignore } from './utils/gitignore'
import { husky } from './utils/husky'
import { vscode } from './utils/vscode'
import { logger } from './utils/logger'
import p from './package.json'
import { lint } from './utils/lint'
import { packageJson } from './utils/package'
import { tsconfig } from './utils/tsconfig'
import { defineRepoTherapyImport as _defineRepoTherapyImport } from './define/import'
import { defineRepoTherapyEnv as _defineRepoTherapyEnv } from './define/env'
import { defineRepoTherapy as _defineRepoTherapy } from './define/index'
// import { join } from 'path'
// import { writeFileSync } from 'fs'

// global.defineRepoTherapy = defineRepoTherapy
// global.defineRepoTherapyImport = defineRepoTherapyImport

// todo rework
export function init (projectType: RepoTherapy.ProjectType, options: {
  gitignore?: {
    additional?: Array<string>
  },
  vscode?: {
    recommendations?: Array<string>
    tabSize?: number
    exclude?: Array<string>
  }
} = {}) {
  logger.info(`Setting up ${p.name}`)
  packageJson(projectType)
  logger.info(' - package.json completed')
  gitignore(projectType, options.gitignore)
  logger.info(' - gitignore completed')
  husky()
  logger.info(' - husky completed')
  vscode(projectType, options.vscode)
  logger.info(' - vscode completed')
  tsconfig(projectType)
  logger.info(' - tsconfig completed')
  lint(projectType)
  logger.info(' - lint completed')
}

// interface PathOptions {
//   rootPath: string
//   configPath: string
//   typeDeclarationPath: string
// }

// export function repoTherapy ({
//   rootPath = __dirname.replace(/\/node_modules\/.*$/, ''),
//   configPath = 'repo-therapy.ts',
//   typeDeclarationPath = 'types.d/_repo-therapy.d.ts'
// }: Partial<PathOptions>) {
//   const iScript = defineRepoTherapyImport()
//   const importObject = iScript().importScript<Partial<{
//     default: ReturnType<typeof defineRepoTherapy>
//   }>>(configPath)
//   if (!importObject?.import) { throw new Error('RepoTherapy config not found') }
//   const config = importObject.import().default
//   if (!config) { throw new Error('RepoTherapy config not found') }
//   return config()
// }

export { logger }
export { _defineRepoTherapyEnv as defineRepoTherapyEnv }
export { _defineRepoTherapyImport as defineRepoTherapyImport}

export default {
  logger,
  init,
  defineRepoTherapy: _defineRepoTherapy,
  defineRepoTherapyEnv: _defineRepoTherapyEnv,
  defineRepoTherapyImport: _defineRepoTherapyImport
}
