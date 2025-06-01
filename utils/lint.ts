import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { extname, join } from 'path'

export function lint (projectType: RepoTherapy.ProjectType) {
  const dir = join(
    __dirname,
    (extname(__filename) === '.js' ? '../' : '') + '../../../'
  )
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
