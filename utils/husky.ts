import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

export function husky () {
  const dir = __dirname.replace(/\/node_modules\/.*$/, '')
  if (!existsSync(dir)) { mkdirSync(dir) }

  writeFileSync(
    join(dir, 'pre-commit'),
    '#!/bin/sh\nyarn lint;\n# Check for modified/untracked files\nif ! git ' +
    'diff --quiet; then\n  echo "Error: There are uncommitted changes in the ' +
    'working directory."\n  echo "Please commit or stash them before running ' +
    'this script."\n  exit 1\nfi'
  )
}
