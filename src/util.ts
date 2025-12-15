import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'

import { findUp } from 'find-up'
import { LibTool } from 'types/lib-tool'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import { genericImport } from './defines/import'
import { defineRepoTherapy } from './defines/index'
import { defineRepoTherapyScript } from './defines/script'
import { NodeEnvOptions } from './statics/enums'
import { type Util } from '../types/repo-therapy'

export type CallableValue <T> = T | ((libTool: LibTool) => T)

interface Option {
  libName: string
  scriptDir: Array<Util.Path | {
    lib: boolean
    path: Util.Path
    absolute?: boolean
  }>
  commandIgnoreEnv: Array<string>
}

export function resolveCallableValue <T> (
  value: CallableValue<T>,
  libTool: LibTool
) {
  if (typeof value === 'function') {
    return (value as (libTool: LibTool) => T)(libTool)
  }
  return value
}

export async function importRepoTherapy () {
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
  return rp()
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

  const libTool = await importRepoTherapy()
    .then(x => x({ skipEnv: commandIgnoreEnv.includes(command) }))

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

  await libTool.importLibFromArray<{
    default: ReturnType<typeof defineRepoTherapyScript>
  }, { lib?: boolean } & Util.DirImport>([{
    lib: true,
    path: join(__dirname, './scripts') as Util.Path,
    absolute: true
  }, ...scriptDir.map(
    path => typeof path === 'string' ? { path, lib: false } : path
  )], ({ path, ...o }) => libTool.importLib.importScriptFromDir<{
    default: ReturnType<typeof defineRepoTherapyScript>
  }>(
    path,
    { ...o, accept: { default: ['define-repo-therapy-script'] } }
  )).loop(async (row) => {
    const f = row.import?.default
    if (!f) { return }
    const s = await f(libTool)(
      row.path,
      row.options.lib ? 'lib' : 'custom'
    )
    y.command({
      command: s.command,
      describe: s.describe,
      handler: s.handlerWithLogging,
      builder: s.builder
    })
  })

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
