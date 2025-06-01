import { execSync } from 'child_process'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { extname, join } from 'path'

export function husky () {
  const dir = join(
    __dirname,
    (extname(__filename) === '.js' ? '../' : '') + '../../../.husky'
  )
  if (!existsSync(dir)) { mkdirSync(dir) }

  writeFileSync(
    join(dir, 'pre-commit'),
    '#!/bin/sh\nyarn lint;\n# Check for modified/untracked files\nif ! git ' +
    'diff --quiet; then\n  echo "Error: There are uncommitted changes in the ' +
    'working directory."\n  echo "Please commit or stash them before running ' +
    'this script."\n  exit 1\nfi'
  )
  if (existsSync(join(dir, '../yarn.lock'))) {
    execSync('yarn add husky', { stdio: 'ignore' })
  } else {
    execSync('npm install husky', { stdio: 'ignore' })
  }
}
