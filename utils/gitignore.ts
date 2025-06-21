import { writeFileSync } from 'fs'
import { join } from 'path'

export const presetIgnoreBase = [
  '!.env.example',
  '!.husky/pre-commit',
  '.dist',
  '.DS_Store',
  '.env-file',
  '.env.*',
  '.env',
  '.fleet',
  '.husky/*',
  '.idea',
  '*.log',
  'logs',
  'node_modules',
  'types.d/_*'
]

export const presetIgnore: Record<RepoTherapy.ProjectType, Array<string>> = {
  backend: [
    ...presetIgnoreBase,
    'dist'
  ],
  'npm-lib': [
    ...presetIgnoreBase,
    '.uploads',
    '.credentials',
    'bin',
    'dist'
  ]
}

export function gitignore (projectType: RepoTherapy.ProjectType, options: {
  additional?: Array<string>
} = {}) {
  const dir = __dirname.replace(/\/node_modules\/.*$/, '')
  const gitIgnore = [
    ...(presetIgnore[projectType] || [])
      .sort((a, b) => a.replace(/^!/, '') > b.replace(/^!/, '') ? 1 : -1),
    '## ADDITIONAL IGNORES ##',
    ...(options.additional || [])
      .sort((a, b) => a.replace(/^!/, '') > b.replace(/^!/, '') ? 1 : -1)
  ]
  writeFileSync(join(dir, '.gitignore'), gitIgnore.join('\n'))
  if (projectType === 'npm-lib') {
    writeFileSync(
      join(dir, '.npmignore'),
      gitIgnore.filter(x => x !== 'bin').join('\n')
    )
  }
}
