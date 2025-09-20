#!/usr/bin/env node
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { defineRepoTherapy } from './index'
import repoTherapyPackageJson from '../package.json'
import { defineRepoTherapyWrapper as wrapper } from './wrapper'

export const f: typeof defineRepoTherapyCli = (
  scriptDir,
  repoTherapy = defineRepoTherapy(),
  packageJsonPath
) => wrapper('define-cli', async () => {
  const p = packageJsonPath
    ? defineRepoTherapyPackageJson({ path: packageJsonPath })
    : repoTherapyPackageJson

  let rt = await repoTherapy()

  function cliAsync () {
    return yargs(hideBin(process.argv))
      .scriptName(p.name || '')
      .parserConfiguration({ 'strip-aliased': true })
      .usage('Usage: $0 <command> [options]')
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
      })
      .demandCommand(1, 'You need at least one valid command')
      .strict()
  }

  const selectedProject = (await cliAsync().argv).project
  if (
    selectedProject &&
    rt.env.project !== selectedProject
  ) {
    await defineRepoTherapy({ project: selectedProject })()
    rt = await repoTherapy()
  }

  console.log()

  // function init () {
  //   console.log(process.argv)
  //   return
  // }

  // const cli = init()

  // cli.middleware(async (argv) => {
  //   repoTherapy = await defineRepoTherapy({
  //     project: argv.project,
  //     projectType: argv.type as RepoTherapy.ProjectType
  //   })()
  //   repoTherapy.logger.info('')
  //   repoTherapy.logger.info(_name)
  //   repoTherapy.logger.info('')
  // })

  // // todo
  // // cli.fail(async (msg) => {
  // //   if (!msg) { return }
  // //   const argv = await init().argv
  // //   if (!repoTherapy) {
  // //     repoTherapy = await defineRepoTherapy({
  // //       project: argv.project,
  // //       projectType: argv.type as RepoTherapy.ProjectType
  // //     })()
  // //   }
  // //   repoTherapy.logger.info('')
  // //   repoTherapy.logger.info(_name)
  // //   repoTherapy.logger.info('')
  // //   await cli.getHelp()
  // //     .then(x => x.split(/\n/).map(y => repoTherapy!.logger.info(y)))
  // //   repoTherapy.logger.info('')
  // //   repoTherapy.logger.error('')
  // //   repoTherapy.logger.error(msg)
  // //   repoTherapy.logger.error('')
  // //   process.exit(1)
  // // })

  // // handler(cli)
  // // scriptDir

  // cli.command({
  //   command: 'init',
  //   describe: 'Initialize repository',
  //   handler: async () => {
  //     if (!repoTherapy) { throw new Error('RepoTherapy not configured.') }
  //     repoTherapy.logger.info('Initiated')
  //     repoTherapy.logger.info(`  project: ${repoTherapy.env.project}`)
  //     repoTherapy.logger.info(`  env: ${repoTherapy.env.nodeEnv}`)
  //   }
  // })

  // cli.help('h').alias('h', 'help')
  // cli.version('v').alias('v', 'version')
  // cli.epilog(`For more information, visit ${
  //   typeof p.repository === 'string' ? p.repository : p.repository?.url
  // }`)
  // await cli.argv
  // if (!repoTherapy) { throw new Error('RepoTherapy not configured.') }
  // repoTherapy.logger.info('')
})

export { f as defineRepoTherapyCli }
