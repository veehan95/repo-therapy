import { dirname, join } from 'path'
import { defineRepoTherapyWrapper as wrapper } from './wrapper'
import { mkdirSync, writeFileSync } from 'fs'

const f: typeof defineRepoTherapyHusky = ({
  packageManager = 'yarn'
} = {}) => wrapper('define-husky', ({ rootPath }) => {
  const path = join(rootPath, '.husky')
  const preCommit = join(path, 'pre-commit')
  return {
    path: { preCommit },
    setup: () => {
      mkdirSync(dirname(preCommit), { recursive: true })
      // todo fix other than yarn
      const lintCommand = packageManager === 'yarn'
        ? 'yarn lint'
        : 'npm run lint'
      writeFileSync(preCommit, [
        '#!/bin/sh',
        `${lintCommand};`,
        '# Check for modified/untracked files',
        'if ! git diff --quiet; then',
        (
          '  echo "Error: There are uncommitted changes in the ' +
          'working directory."'
        ),
        '  echo "Please commit or stash them before running this script."',
        '  exit 1',
        'fi',
        ''
      ].join('\n'))
    }
  }
})

export { f as defineRepoTherapyHusky }
