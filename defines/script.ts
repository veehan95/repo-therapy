import { basename } from 'node:path'
import { GenerateStatus, NodeEnvOptions } from 'statics/enums'
import { Argv } from 'yargs'
import { LibTool } from '../types/lib-tool'
import { Util } from '../types/repo-therapy'
import { defineRepoTherapyInternalWrapper as wrapper } from './wrapper'

export interface Content {
  status?: GenerateStatus
  path: string
}

export interface ScriptLibTool extends LibTool {
  printList: <C extends Content> (
    header: string,
    content: Array<C | string> | C | string,
    callback?: (x: Content) => string
  ) => void
}

// todo scheduler
export function defineRepoTherapyScript <
  T extends object,
  ScriptArgv extends object = T & {
    project?: string
    env?: NodeEnvOptions
  }
> (
  describe: string | Array<string>,
  handler: (args: ScriptArgv, libTool: ScriptLibTool) => void | Promise<void>,
  { command: c, builder }: {
    command?: string
    builder?: (argv: Argv<ScriptArgv>, libTool: LibTool) => Argv<T>
  } = {}
) {
  return wrapper('script', async (libTool) => {
    return (scriptPath: Util.Path, scriptType: 'custom' | 'lib') => {
      let command = c
      if (!command) {
        const path = basename(scriptPath).replace(/\.([^].)$/, '')
        const dynamicParamRegExop = /-\[([^\]]+)\]/g
        const commandBase = path.replace(dynamicParamRegExop, ' <$1>')
        command = (scriptType === 'custom' ? 'exec:' : '') + commandBase
      }

      return {
        command,
        builder: builder
          ? (argv: Argv<ScriptArgv>) => builder(argv, libTool)
          : undefined,
        describe: typeof describe === 'string' ? describe : describe.join('\n'),
        handler: async (argv: ScriptArgv) => {
          libTool.logger.info('Executing\t' + (
            scriptType === 'lib'
              ? command
              : `custom script:${scriptPath}`
          ))
          try {
            await handler(argv, {
              ...libTool,
              printList: <C extends Content> (
                header: string,
                content: Array<C | string> | C | string,
                callback: (x: C) => string = (x) => x.path || JSON.stringify(x)
              ) => {
                const cArr = (Array.isArray(content) ? content : [content])
                  .map(path => typeof path === 'string'
                    ? { path, status: libTool.enum.GenerateStatus.created }
                    : path
                  )
                if (cArr.length === 0) { return }
                libTool.logger.info('')
                libTool.logger.info(header)
                cArr.sort((a, b) => a.path > b.path ? 1 : -1)
                  .forEach(r => {
                    libTool.logger.info(`  ${(
                      r.status === libTool.enum.GenerateStatus.updated
                        ? (
                          libTool.enum.ConsoleFontColor.yellow +
                          libTool.enum.EmojiAndUnicode.circle
                        )
                          : r.status === libTool.enum.GenerateStatus.created
                            ? (
                              libTool.enum.ConsoleFontColor.green +
                              libTool.enum.EmojiAndUnicode.tick
                            )
                            : (
                              libTool.enum.ConsoleFontColor.red +
                              libTool.enum.EmojiAndUnicode.cross
                            )
                    ) + libTool.enum.ConsoleFontColor.close} ${
                      callback(r as C)
                    }`)
                  })
              }
            })
          } catch (err) {
            libTool.logger.info('')
            let msg = (err as Error).message.replace(/^\s*/, '')
            if ((err as Error).stack) { msg += '\n' + (err as Error).stack }
            libTool.logger.error(msg)
          }
          libTool.logger.info('')
        }
      }
    }
  })
}
