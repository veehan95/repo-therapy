import { gitignore } from './utils/gitignore'
import { husky } from './utils/husky'
import { vscode } from './utils/vscode'
import { logger } from './utils/logger'
import p from './package.json'
import { lint } from './utils/lint'
import { packageJson } from './utils/package'
import { tsconfig } from './utils/tsconfig'
import { importScript, importScriptFromDir } from './utils/import'
import { join } from 'path'
import { writeFileSync } from 'fs'
import { defineRepoTherapy } from './utils/define'

global.defineRepoTherapy = defineRepoTherapy

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

export function repoTherapy (
  {
    rootPath,
    configPath = 'repo-therapy.ts',
    typeDeclarationPath = 'types.d/_repo-therapy.d.ts'
  }: {
    rootPath: string
    configPath?: string
    typeDeclarationPath?: string
  }
) {
  const importObject = importScript<Partial<{
    default: ReturnType<typeof defineRepoTherapy>
  }>>(rootPath, configPath)
  if (!importObject?.import) { throw new Error('RepoTherapy config not found') }
  const config = importObject.import().default
  if (!config) { throw new Error('RepoTherapy config not found') }
  const { env, envType } = config()

  return {
    getTypeDeclaration: () => {
      writeFileSync(
        join(rootPath, typeDeclarationPath),
        `declare global {\n  ${envType().replace(/\n/g, '\n  ')}\n}`
      )
    },
    env
  }
}

export default { logger, init, repoTherapy, importScript, importScriptFromDir }
