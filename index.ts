import { findUp } from 'find-up'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { genericImport } from './defines/import'
import { defineRepoTherapy } from './defines/index'
import { defineRepoTherapyScript } from './defines/script'
import { NodeEnvOptions } from './statics/enums'
import { type Util } from './types/repo-therapy'

export { defineRepoTherapyCsv } from './defines/csv'
export { defineRepoTherapyEnv } from './defines/env'
export { defineRepoTherapyImport } from './defines/import'
export { defineRepoTherapyLogger } from './defines/logger'
export { defineRepoTherapyWrapper } from './defines/wrapper'
export { defineRepoTherapy }

interface Option {
  libName: string
  scriptDir: Array<Util.Path | {
    lib: boolean
    path: Util.Path
    absolute?: boolean
  }>
  commandIgnoreEnv: Array<string>
}

export async function cli ({
  scriptDir = [],
  commandIgnoreEnv: commandIgnoreEnvCustom
}: Partial<Option> = {}) {
  const commandIgnoreEnv = [
    'env:default',
    'env:generate',
    ...(commandIgnoreEnvCustom || [])
  ]

  const y = yargs(hideBin(process.argv))
    .parserConfiguration({ 'strip-aliased': true })
    .usage('Usage: $0 <command> [options]')
    .option('project', {
      alias: 'p',
      describe: 'Project name',
      type: 'string'
    })
    .option('env', {
      alias: 'e',
      describe: 'Node environment',
      choices: Object.values(NodeEnvOptions),
      default: NodeEnvOptions.local
    })

  const initArgv = await y.parseAsync()
  const command = initArgv._[0]?.toString()

  const dr = await findUp('package.json')
  const repoTherapySettingPath = join(
    dr ? dirname(dr) : process.cwd(),
    '/repo-therapy.ts'
  )
  const rp = existsSync(repoTherapySettingPath)
    ? await genericImport<ReturnType<typeof defineRepoTherapy>>(
      repoTherapySettingPath
    )
    : defineRepoTherapy()
  if (!rp) { throw new Error('Misisng /repo-thnerapy.ts configurations') }
  const libTool = await rp()({ skipEnv: commandIgnoreEnv.includes(command) })

  y.scriptName(libTool.libName)

  if (command && !initArgv.h) {
    libTool.logger.info('')
    libTool.logger.info(`* ${libTool.libName} *`)
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
    path: join(__dirname, './scripts') as Util.Path,
    absolute: true
  }, ...scriptDir.map(
    path => typeof path === 'string' ? { path, lib: false } : path
  )]

  for (const i in scriptDirList) {
    const dirScripts = await libTool.importLib.importScriptFromDir<{
      default: ReturnType<typeof defineRepoTherapyScript>
    }>(scriptDirList[i].path, {
      absolute: scriptDirList[i].absolute,
      accept: { default: ['define-repo-therapy-script'] }
    })

    for (const j in dirScripts) {
      if (!dirScripts[j].import) { continue }
      const s = (await dirScripts[j].import.default())(
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
