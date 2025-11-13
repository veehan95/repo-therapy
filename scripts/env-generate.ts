import { NodeEnvOptions } from '../enums'
import { defineRepoTherapyScript } from '../defines/script'

export default defineRepoTherapyScript<{
  // todo fix keyof typeof NodeEnvOptions
  env?: string
  defaultValues?: boolean
  overwrite?: boolean
}>([
  'Generate env file for each project.',
  '* Overwrite all existing env if overwrite flag is true.'
], async (a, libTool) => {
  const r = await libTool.generateEnv('/.env', {
    nodeEnv: a.env as keyof typeof NodeEnvOptions,
    defaultValues: a.defaultValues,
    overwrite: a.overwrite
  })

  if (a.env) { libTool.logger.info(`Env: ${a.env}`) }

  libTool.logger.info('')
  libTool.logger.info(`Type declaration: ${r.typePath}`)

  const newWrite = r.envCreation.filter(x => x.write)
  if (newWrite.length > 0) {
    libTool.logger.info('')
    libTool.logger.info('Generated env at:')
    newWrite.forEach(p => { libTool.logger.info(`  ${p.path}`) })
  }

  const skipped = r.envCreation.filter(x => !x.write)
  if (skipped.length > 0) {
    libTool.logger.info('')
    libTool.logger.info('Skipped env:')
    skipped.forEach(p => { libTool.logger.info(`  ${p.path}`) })
  }
}, {
  command: 'env:generate [env]',
  builder: (a) => a
    .positional('env', {
      describe: 'Node environment',
      choices: Object.keys(NodeEnvOptions)
    })
    .option('default-values', {
      describe: 'Show default values in the .env file',
      alias: 'd',
      boolean: true,
      default: true
    })
    .option('overwrite', {
      describe: 'Overwrite all current env files (reuses values if exist)',
      alias: 'o',
      boolean: true,
      default: false
    })
})
