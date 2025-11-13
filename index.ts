import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { join } from 'node:path'
import { defineRepoTherapy } from './defines/index'
import { type Util } from './types/repo-therapy'
import { defineRepoTherapyScript } from './defines/script'

export { defineRepoTherapy } from './defines/index'
export { defineRepoTherapyCsv } from './defines/csv'
export { defineRepoTherapyEnv } from './defines/env'
export { defineRepoTherapyImport } from './defines/import'
export { defineRepoTherapyLogger } from './defines/logger'
export { defineRepoTherapyWrapper } from './defines/wrapper'

interface Option {
  libName: string
  repoTherapy: (project?: string, option?: {
    envSkip?: boolean
  }) => ReturnType<typeof defineRepoTherapy>
  scriptDir: Array<Util.Path | {
    lib: boolean
    path: Util.Path
  }>
  commandIgnoreEnv: Array<string>
}

export async function cli ({
  libName = 'RepoTherapy',
  repoTherapy = (project?: string, option: {
    envSkip?: boolean
  } = {}) => defineRepoTherapy({
    // todo remove
    env: (v) => ({ test: v(['test only', 'haha']).isString() }),
    project,
    envInterfaceName: 'RepoTherapy',
    envSkip: option.envSkip
  }),
  scriptDir = [],
  commandIgnoreEnv: commandIgnoreEnvCustom
}: Partial<Option> = {}) {
  const commandIgnoreEnv = [
    'env:default',
    'env:generate',
    ...(commandIgnoreEnvCustom || [])
  ]

  const y = yargs(hideBin(process.argv))
    .scriptName(libName)
    .parserConfiguration({ 'strip-aliased': true })
    .usage('Usage: $0 <command> [options]')
    .option('project', {
      alias: 'p',
      describe: 'Project name',
      type: 'string'
    })
  const initArgv = await y.parseAsync()
  const command = initArgv._[0]?.toString()
  const libTool = (await repoTherapy(
    initArgv.project,
    { envSkip: commandIgnoreEnv.includes(command) }
  ))()

  if (command && !initArgv.h) {
    libTool.logger.info('')
    libTool.logger.info(`* ${libName} *`)
    if (libTool.env) {
      if (libTool.env.project) {
        libTool.logger.info(`Project\t${libTool.env.project}`)
      }
      if (libTool.env.nodeEnv) {
        libTool.logger.info(`Env\t\t${libTool.env.nodeEnv}`)
      }
    }
    libTool.logger.info('')
  }

  const scriptDirList = [{
    lib: true,
    path: join(__dirname, './scripts') as Util.Path
  }, ...scriptDir.map(
    path => typeof path === 'string' ? { path, lib: false } : path
  )]

  for (const i in scriptDirList) {
    const dirScripts = await libTool.importLib.importScriptFromDir<{
      default: ReturnType<typeof defineRepoTherapyScript>
    }>(scriptDirList[i].path)
    for (const j in dirScripts) {
      const s = await dirScripts[j].import.default(
        libTool,
        dirScripts[j].path,
        scriptDirList[i].lib ? 'lib' : 'custom'
      )
      y.command({
        command: s.command,
        describe: s.describe,
        handler: s.handler,
        builder: s.builder
      })
    }
  }

  y.help().alias('help', 'h')
  y.demandCommand(1, 'You need at least one valid command')
  y.strict()
  y.fail((e) => {
    libTool.logger.error(
      e +
      '\n\nUse -h to view all possible commands and parameters.'
    )
    process.exit()
  })

  y.parse()
}
