import { writeFileSync } from 'fs'
import { extname, join } from 'path'

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
  'node_modules'
]

export const presetIgnore: Record<RepoTherapy.ProjectType, Array<string>> = {
  backend: [
    ...presetIgnoreBase,
    'dist'
  ],
  knexpresso: [
    ...presetIgnoreBase,
    '.knexpresso',
    '.uploads',
    '.credentials',
    'bin',
    'dist',
    'docker-compose.yml'
  ],
  'npm-lib': [
    ...presetIgnoreBase,
    '.knexpresso',
    '.uploads',
    '.credentials',
    'bin',
    'dist',
    'docker-compose.yml'
  ]
}

export function gitignore (projectType: RepoTherapy.ProjectType, options: {
  additional?: Array<string>
} = {}) {
  const dir = join(
    __dirname,
    (extname(__filename) === '.js' ? '../' : '') + '../../../'
  )
  writeFileSync(
    join(dir, '.gitignore'),
    [
      ...(presetIgnore[projectType] || []).sort(),
      '## ADDITIONAL IGNORES ##',
      ...(options.additional || []).sort()
    ].join('\n')
  )
  if (projectType === 'npm-lib') {
    writeFileSync(
      join(dir, '.npmignore'),
      [
        ...(presetIgnore[projectType] || []).sort(),
        '## ADDITIONAL IGNORES ##',
        ...(options.additional || []).sort()
      ].filter(x => x !== 'bin').join('\n')
    )
  }
}
