#!/usr/bin/env node
import { init } from './index'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { cpSync } from 'fs'
import { join } from 'path'
import p from './package.json'

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
          choices: ['npm-lib', 'backend', 'knexpresso'],
          type: 'string'
        }),
      handler: (argv) => {
        init(argv.type as RepoTherapy.ProjectType)
      }
    })
    .help('h')
    .alias('h', 'help')
    .epilog(`For more information, visit ${p.repository.url}`)
    .argv
})().then()
