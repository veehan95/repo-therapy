import { Argv } from 'yargs'
import { defineRepoTherapyInternalWrapper as wrapper } from './wrapper'
import { basename } from 'node:path'
import { LibTool } from '../types/lib-tool'
import { Util } from '../types/repo-therapy'

// todo scheduler
export function defineRepoTherapyScript <T extends object> (
  describe: string | Array<string>,
  handler: (args: T, libTool: LibTool) => void | Promise<void>,
  { command: c, builder }: {
    command?: string
    builder?: (argv: Argv<T>, libTool: LibTool) => Argv<T>
  } = {}
) {
  return wrapper('define-script', async (
    libTool,
    scriptPath: Util.Path,
    scriptType: 'custom' | 'lib'
  ) => {
    let command = c
    if (!command) {
      const path = basename(scriptPath).replace(/\.([^].)$/, '')
      const dynamicParamRegExop = /-\[([^\]]+)\]/g
      const commandBase = path.replace(dynamicParamRegExop, ' <$1>')
      command = (scriptType === 'custom' ? 'exec:' : '') + commandBase
    }

    return {
      command,
      builder: builder ? (argv: Argv<T>) => builder(argv, libTool) : undefined,
      describe: typeof describe === 'string' ? describe : describe.join('\n'),
      handler: async (argv: T) => {
        libTool.logger.info('Executing\t' + (
          scriptType === 'lib'
            ? command
            : `custom script:${scriptPath}`
        ))
        libTool.logger.info('')
        try {
          await handler(argv, libTool)
        } catch (err) {
          libTool.logger.info('')
          let msg = (err as Error).message.replace(/^\s*/, '')
          if ((err as Error).stack) { msg += '\n' + (err as Error).stack }
          libTool.logger.error(msg)
        }
        libTool.logger.info('')
      }
    }
  })
}
