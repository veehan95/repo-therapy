#!/usr/bin/env node
import { defineRepoTherapy } from './define/index'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import p from './package.json'

(async () => {
  await yargs(hideBin(process.argv))
    .scriptName(p.name)
    .parserConfiguration({ 'strip-aliased': true })
    .usage('Usage: $0 <command> [options]')
    .command({
      command: 'init',
      describe: 'Initialize repository',
      builder: argv => argv
        .positional('project', {
          alias: 'p',
          describe: 'Project name',
          type: 'string'
        })
        .positional('type', {
          alias: 't',
          describe: 'Type of project',
          choices: ['npm-lib', 'backend', 'frontend'],
          type: 'string'
        }),
      handler: async (argv) => {
        await defineRepoTherapy({
          project: argv.project,
          projectType: argv.type as RepoTherapy.ProjectType
        })().then(x => x.init())
      }
    })
    // todo
    // .command({
    //   command: 'generate',
    //   describe: 'Generate env type',
    //   // builder: argv => argv
    //   //   .option('path', {
    //   //     alias: 'p',
    //   //     describe: 'Path to save env declaration',
    //   //     type: 'string',
    //   //     default: 'types/_env.d.ts'
    //   //   })
    //   //   .option('config', {
    //   //     alias: 'c',
    //   //     describe: 'Relative path to config file',
    //   //     type: 'string'
    //   //   }),
    //   handler: (argv) => {
    //     // todo args
    //     const {
    //       generateTypeDeclaration
    //     } = repoTherapy({ rootPath: __dirname
    // .replace(/node_modules\/.*$/, '') })
    //     generateTypeDeclaration()
    //   }
    // })
    // todo
    // .command({
    //   command: 'swap',
    //   describe: 'Change env file',
    //   handler: (argv) => {
    //     const { _ } = argv
    //     if (!_[1]) {
    //       logger.error('Project slug is required')
    //       process.exit(2)
    //     }
    //     useEnv(_[1].toString())
    //   }
    // })
    .help('h')
    .alias('h', 'help')
    .epilog(`For more information, visit ${p.repository.url}`)
    .argv
})().then()
