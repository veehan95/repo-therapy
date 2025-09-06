#!/usr/bin/env node
import { defineRepoTherapy } from './index'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { startCase } from 'lodash'
import p from '../package.json'
import { defineRepoTherapyWrapper as wrapper } from './wrapper'

export const f: typeof defineRepoTherapyCli = (
  handler = () => {}
) => wrapper('define-cli', async () => {
  let repoTherapy: Awaited<
    ReturnType<ReturnType<typeof defineRepoTherapy>> | undefined
  >
  function init () {
    return yargs(hideBin(process.argv))
      .scriptName(p.name)
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

  const cli = init()

  cli.middleware(async (argv) => {
    repoTherapy = await defineRepoTherapy({
      project: argv.project,
      projectType: argv.type as RepoTherapy.ProjectType
    })()
    await repoTherapy.init()
    repoTherapy.logger.info('')
    repoTherapy.logger.info(startCase(p.name))
    repoTherapy.logger.info('')
  })

  // todo
  cli.fail(async (msg) => {
    if (!msg) { return }
    const argv = await init().argv
    if (!repoTherapy) {
      repoTherapy = await defineRepoTherapy({
        project: argv.project,
        projectType: argv.type as RepoTherapy.ProjectType
      })()
    }
    repoTherapy.logger.info('')
    repoTherapy.logger.info(startCase(p.name))
    repoTherapy.logger.info('')
    await cli.getHelp()
      .then(x => x.split(/\n/).map(y => repoTherapy!.logger.info(y)))
    repoTherapy.logger.info('')
    repoTherapy.logger.error('')
    repoTherapy.logger.error(msg)
    repoTherapy.logger.error('')
    process.exit(1)
  })

  handler(cli)

  cli.command({
    command: 'init',
    describe: 'Initialize repository',
    handler: async () => {
      if (!repoTherapy) { throw new Error('RepoTherapy not configured.') }
      repoTherapy.logger.info('Initiated')
      repoTherapy.logger.info(`  project: ${repoTherapy.env.project}`)
      repoTherapy.logger.info(`  env: ${repoTherapy.env.nodeEnv}`)
    }
  })

  cli.help('h').alias('h', 'help')
  cli.version('v').alias('v', 'version')
  cli.epilog(`For more information, visit ${p.repository.url}`)
  await cli.argv
  if (!repoTherapy) { throw new Error('RepoTherapy not configured.') }
  repoTherapy.logger.info('')
  return { cli: undefined }
})

export { f as defineRepoTherapyCli }
