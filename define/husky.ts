import { dirname, join } from 'path'
import { defineRepoTherapyWrapper as wrapper } from './wrapper'
import { mkdirSync, writeFileSync } from 'fs'

const f: typeof defineRepoTherapyHusky = (
  // todo
  // options
) => wrapper('define-husky', ({ rootPath }) => {
  const path = join(rootPath, '.husky')
  const preCommit = join(path, 'pre-commit')
  return {
    path: { preCommit },
    setup: () => {
      mkdirSync(dirname(preCommit), { recursive: true })
      // todo other than yarn
      writeFileSync(
        preCommit,
        '#!/bin/sh\nyarn lint;\n# Check for modified/untracked files\nif ! ' +
        'git diff --quiet; then\n  echo "Error: There are uncommitted ' +
        'changes in the working directory."\n  echo "Please commit or stash ' +
        'them before running this script."\n  exit 1\nfi\n'
      )
    }
  }
})

export { f as defineRepoTherapyHusky }
