#!/usr/bin/env node
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { defineRepoTherapy } from './index'
import repoTherapyPackageJson from '../package.json'
import { defineRepoTherapyWrapper as wrapper } from './wrapper'
import { join } from 'path'

export const f: typeof defineRepoTherapyCli = (
  scriptDir,
  repoTherapy = defineRepoTherapy(),
  packageJsonPath
) => wrapper('define-cli', async () => {
  const p = packageJsonPath
    ? defineRepoTherapyPackageJson({ path: packageJsonPath })
    : repoTherapyPackageJson

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
  await defineRepoTherapy({ project: selectedProject })()
  const rt = await repoTherapy()

  rt.logger.info('')
  rt.logger.info(p.name)
  rt.logger.info(`Project: ${rt.project}`)
  rt.logger.info(`Env: ${rt.env.nodeEnv}`)
  rt.logger.info('')

  const libScript = scriptDir
    ? typeof scriptDir.lib === 'string' ? [scriptDir.lib] : scriptDir.lib
    : []
  const customScript = scriptDir
    ? typeof scriptDir.custom === 'string'
      ? [scriptDir.custom]
      : scriptDir.custom
    : []
  const fullScriptDir = Object
    .entries({
      lib: [join(__dirname, '../cli'), ...libScript],
      custom: customScript
    })
    .flatMap(([category, v]) => v.map(dir => ({ category, dir })))

  const actualCli = cliAsync()
  for (let i = 0; i < fullScriptDir.length; i++) {
    const { category, dir } = fullScriptDir[i]
    const f = await rt.import<{
      default: ReturnType<typeof defineRepoTherapyScript>
    }>({
      accept: { default: 'define-script' }
    })().importScriptFromDir(dir)
    for (let j = 0; j < f.length; j++) {
      const fImport = f[j].import
      if (!fImport) { throw new Error(`Empty script found ${f[j].path}`) }
      const s = await fImport
        .default(rt, f[j].path, category as 'lib' | 'custom')
      actualCli.command(s.command, s.describe, s.builder, s.handler)
    }
  }
  await actualCli.argv

  // function init () {
  //   console.log(process.argv)
  //   return
  // }

  // const cli = init()

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
