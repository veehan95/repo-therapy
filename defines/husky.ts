import { join } from 'node:path'
import { mkdirSync, writeFileSync } from 'node:fs'
import { defineRepoTherapyInternalWrapper as wrapper } from './wrapper'
import { RunCommand } from 'enums'

export function defineRepoTherapyHusky ({
  preCommit: preCommitSetup = true,
  commitMessage: commitMessageSetup = true,
  prePush: prePushSetup = true
} = {}) {
  return wrapper('define-husky', (libTool) => {
    const config = {
      preCommit: {
        enable: preCommitSetup,
        path: join(libTool.absolutePath.husky, 'pre-commit'),
        content: [
          `${`${RunCommand[libTool.packageManager]} lint`};`,
          '# Check for modified/untracked files',
          'if ! git diff --quiet; then',
          (
            '  echo "Error: There are uncommitted changes in the ' +
            'working directory."'
          ),
          '  echo "Please commit or stash them before running this script."',
          '  exit 1',
          'fi'
        ]
      },
      commitMessage: {
        enable: commitMessageSetup,
        path: join(libTool.absolutePath.husky, 'commit-message'),
        content: []
      },
      prePush: {
        enable: prePushSetup,
        path: join(libTool.absolutePath.husky, 'pre-push'),
        content: []
      }
    }

    function setup (key: keyof typeof config) {
      if (!config[key].enable) { return }
      writeFileSync(
        config[key].path,
        ['#!/bin/sh', ...config[key].content, ''].join('\n')
      )
      return config[key].path
    }

    return {
      setup: () => {
        mkdirSync(libTool.absolutePath.husky, { recursive: true })
        return (Object.keys(config) as Array<keyof typeof config>)
          .map(k => ({ path: setup(k), created: true }))
          .filter(({ path }) => path)
      }
    }
  })
}
