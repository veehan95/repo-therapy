import { Argv } from 'yargs'
import { defineRepoTherapyWrapper as wrapper } from './wrapper'
import { basename } from 'path'

// todo scheduler
const f: typeof defineRepoTherapyScript = <T extends object> (
  describe: string,
  handler: (libTool: RepoTherapy.DefineLibTool, args: T) => void,
  builder: ((
    libTool: RepoTherapy.DefineLibTool,
    argv: Argv<T>
  ) => void | Argv<T>) = () => {}
) => wrapper('define-script', async (libTool, scriptPath, scriptType) => {
    const command = basename(scriptPath).replace(/\.([^].)$/, '')
    return {
      command: (scriptType === 'custom' ? 'exec ' : '') + command,
      builder: (argv: Argv<T>) => builder(libTool, argv),
      describe,
      handler: (argv: T) => {
        libTool.logger
          .info(`Executing ${scriptType === 'lib' ? command : scriptPath}`)
        try {
          handler(libTool, argv)
        } catch (err) {
          libTool.logger.info('')
          libTool.logger.info('Execution Failed')
          libTool.logger.error(err)
        }
        libTool.logger.info('')
      }
    }
  })

export { f as defineRepoTherapyScript }
