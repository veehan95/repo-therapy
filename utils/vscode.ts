import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

export const presetRecommendations: Record<
  RepoTherapy.ProjectType,
  Array<string>
> = {
  backend: [
    'dbaeumer.vscode-eslint',
    'eamodio.gitlens',
    'ms-azuretools.vscode-docker'
  ],
  knexpresso: [
    'amandeepmittal.pug',
    'dbaeumer.vscode-eslint',
    'eamodio.gitlens',
    'janisdd.vscode-edit-csv',
    'ms-azuretools.vscode-docker'
  ],
  'npm-lib': [
    'dbaeumer.vscode-eslint',
    'eamodio.gitlens'
  ]
}

export const presetExlcudeBase = [
  '.dist',
  '.DS_Store',
  '.fleet',
  '.gitignore',
  '.husky',
  '.idea',
  '.vscode',
  '*.log',
  'eslint.config.mjs',
  'logs',
  'node_modules',
  'tsconfig.json',
  'yarn.lock'
]

export const presetExlcude: Record<RepoTherapy.ProjectType, Array<string>> = {
  backend: [
    ...presetExlcudeBase,
    '.uploads',
    'dist'
  ],
  knexpresso: [
    ...presetExlcudeBase,
    '.knexpresso',
    '.uploads',
    'dist',
    'docker-compose.yml'
  ],
  'npm-lib': [
    ...presetExlcudeBase,
    '.npmignore',
    '.bin'
  ]
}

export function vscode (projectType: RepoTherapy.ProjectType, options: {
  recommendations?: Array<string>
  tabSize?: number
  exclude?: Array<string>
} = {}) {
  const dir = join(__dirname, '../../../.vscode')
  if (!existsSync(dir)) { mkdirSync(dir) }

  const recommendations = [
    ...(options.recommendations || []),
    ...(presetRecommendations[projectType] || [])
  ].sort()
  writeFileSync(
    join(dir, 'extensions.json'),
    JSON.stringify({ recommendations }, undefined, 2)
  )

  const exclude = Object.fromEntries([
    ...(options.exclude || []),
    ...(presetExlcude[projectType] || [])
  ].sort().map(x => [x, true]))
  writeFileSync(
    join(dir, 'extensions.json'),
    JSON.stringify({
      'editor.tabSize': options.tabSize || 2,
      'eslint.enable': true,
      'eslint.format.enable': true,
      'editor.codeActionsOnSave': {
        'source.fixAll.eslint': 'explicit'
      },
      'files.exclude': exclude
    }, undefined, 2)
  )
}
