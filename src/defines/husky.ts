import { join } from 'node:path'

import { Content } from './script'
import { defineRepoTherapyInternalWrapper as wrapper } from './wrapper'
import { GitHook } from '../statics/enums'
import { type Util } from '../../types/repo-therapy'

export interface HuskyOptions {
  preCommit?: boolean
  commitMessage?: boolean
  prePush?: boolean
}

export function defineRepoTherapyHusky (options: HuskyOptions = {}) {
  return wrapper('husky', (libTool) => {
    return {
      setup: async (): Promise<Array<Content>> => {
        const config = {
          preCommit: {
            enable: options.preCommit,
            path: GitHook.preCommit,
            content: [
              `${`${libTool.packageManager} lint`};`,
              '# Check for modified/untracked files',
              'if ! git diff --quiet; then',
              (
                '  echo "Error: There are uncommitted changes in the working ' +
                'directory."'
              ),
              (
                '  echo "Please commit or stash them before running this ' +
                'script."'
              ),
              '  exit 1',
              'fi'
            ]
          },
          commitMessage: {
            enable: options.commitMessage,
            path: GitHook.commitMessage,
            // todo
            content: []
          },
          prePush: {
            enable: options.prePush,
            path: GitHook.prePush,
            // todo
            content: []
          }
        }

        return (await Promise.all(
          (Object.keys(config) as Array<keyof typeof config>)
            .map(async (key) => await libTool
              .importLib
              .writeStatic(
                join('/.husky', config[key].path) as Util.Path,
                () => ['#!/bin/sh', ...config[key].content, ''].join('\n'),
                { overwrite: true }
              )
            )
        )).filter(({ path }) => path)
      }
    }
  })
}
