import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

export function lint (projectType: RepoTherapy.ProjectType) {
  const dir = __dirname.replace(/\/node_modules\/.*$/, '')
  if (!existsSync(dir)) { mkdirSync(dir) }

  writeFileSync(
    join(dir, 'eslint.config.mjs'),
    [
      `import lint from 'repo-therapy/eslint/${projectType}.mjs'`,
      'import p from \'./package.json\' with { type: \'json\' }',
      '',
      'export default lint(p.name)',
      ''
    ].join('\n')
  )
}
