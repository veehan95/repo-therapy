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

  const libScript = (
    scriptDir
      ? typeof scriptDir.lib === 'string' ? [scriptDir.lib] : scriptDir.lib
      : []
  ) || []
  const customScript = (
    scriptDir
      ? typeof scriptDir.custom === 'string'
        ? [scriptDir.custom]
        : scriptDir.custom
      : []
  ) || []
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
    const obj: Record<
      string,
      Awaited<ReturnType<ReturnType<typeof defineRepoTherapyScript>>>
    > = {}
    for (let j = 0; j < f.length; j++) {
      const fImport = f[j].import
      if (!fImport) { throw new Error(`Empty script found ${f[j].path}`) }
      const s = await fImport
        .default(rt, f[j].path, category as 'lib' | 'custom')
      obj[s.command] = s
    }
    Object.values(obj).forEach((x) => {
      actualCli.command(x.command, x.describe, x.builder, x.handler)
    })
  }
  await actualCli.argv
})

export { f as defineRepoTherapyCli }
