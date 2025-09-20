import { Argv } from 'yargs'
import { defineRepoTherapyWrapper as wrapper } from './wrapper'

// todo scheduler
const f: typeof defineRepoTherapyScript = <T extends object> (
  handler: (libTool: RepoTherapy.DefineLibTool, args: T) => void,
  builder: ((
    libTool: RepoTherapy.DefineLibTool,
    argv: Argv<T>
  ) => void | Argv<T>) = () => {}
) => wrapper('define-script', async (libTool, scriptName) => ({
    scriptName,
    builder: (argv: Argv<T>) => builder(libTool, argv),
    handler: (argv: T) => {
      libTool.logger.info(`Executing ${scriptName}`)
      try {
        handler(libTool, argv)
      } catch (err) {
        libTool.logger.info('')
        libTool.logger.info('Execution Failed')
        libTool.logger.error(err)
      }
      libTool.logger.info('')
    }
  }))

export { f as defineRepoTherapyScript }
