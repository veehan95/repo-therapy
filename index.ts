import { gitignore } from './utils/gitignore'
import { husky } from './utils/husky'
import { vscode } from './utils/vscode'
import { logger } from './utils/logger'
import p from './package.json'
import { lint } from './utils/lint'
import { packageJson } from './utils/package'
import { tsconfig } from './utils/tsconfig'

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

export default { logger, init }
