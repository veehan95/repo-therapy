import envDefault from './env-default'
import { defineRepoTherapyScript } from '../defines/script'
import { NodeEnvOptions } from '../statics/enums'

export interface Argv {
  env: NodeEnvOptions
  defaultValues?: boolean
  overwrite?: boolean
}

export default defineRepoTherapyScript<Argv>([
  'Generate env file for each project.',
  '* Overwrite all existing env if overwrite flag is true.'
], async (a, libTool) => {
  libTool.logger.info('')
  libTool.logger.info(`Env: ${a.env}`)

  const r = await libTool.generateEnv('/.env', {
    project: a.project,
    nodeEnv: a.env as NodeEnvOptions,
    defaultValues: a.defaultValues,
    overwrite: a.overwrite
  })

  libTool.printList('Type declaration', r.typePath)
  libTool.printList('Env', r.envCreation)

  if (!a.project) {
    a.project = /^\/\.env\.([^.]*)\..*$/.exec(r.envCreation[0].path)![1]
  }

  await envDefault(libTool)('/', 'custom').handler(a)
}, {
  command: 'env:generate',
  builder: (a) => a
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
