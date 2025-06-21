#!/usr/bin/env node
import { init } from './index'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { cpSync } from 'fs'
import { join } from 'path'
import p from './package.json'
import { logger } from './utils/logger'
import { generateType, useEnv } from './utils/env/generator'
import { getConfig } from './utils/env/utils'

(async () => {
  cpSync(
    join(__dirname, '../types.d'),
    join(__dirname, `../../@types/${p.name}`),
    { recursive: true }
  )

  await yargs(hideBin(process.argv))
    .scriptName(p.name)
    .parserConfiguration({ 'strip-aliased': true })
    .usage('Usage: $0 <command> [options]')
    .command({
      command: 'init',
      describe: 'Initialize repository',
      builder: argv => argv
        .positional('type', {
          alias: 't',
          describe: 'Type of project',
          choices: ['npm-lib', 'backend'],
          type: 'string'
        }),
      handler: (argv) => {
        init(argv.type as RepoTherapy.ProjectType)
      }
    })
    .command({
      command: 'generate',
      describe: 'Generate env type',
      builder: argv => argv
        .option('path', {
          alias: 'p',
          describe: 'Path to save env declaration',
          type: 'string',
          default: 'types.d/_env.d.ts'
        })
        .option('config', {
          alias: 'c',
          describe: 'Relative path to config file',
          type: 'string'
        }),
      handler: (argv) => {
        const { _, path } = argv
        const { config } = getConfig(argv.config)
        generateType(config.list, _[1].toString(), path)
      }
    })
    .command({
      command: 'swap',
      describe: 'Change env file',
      handler: (argv) => {
        const { _ } = argv
        if (!_[1]) {
          logger.error('Project slug is required')
          process.exit(2)
        }
        useEnv(_[1].toString())
      }
    })
    .help('h')
    .alias('h', 'help')
    .epilog(`For more information, visit ${p.repository.url}`)
    .argv
})().then()
