import { defineRepoTherapyScript } from '../defines/script'
export interface Argv {
  project?: string
  env?: string
}

export default defineRepoTherapyScript<Argv>(
  'Set default env.',
  async (a, libTool) => {
    if (!a.project) { throw new Error('Missing project') }

    libTool.printList(
      'Default env',
      await libTool.importLib.writeStatic(
        '/.env',
        () => libTool.importLib
          .importStatic(`/.env.${a.project}.${a.env}`)
          .then(x => x.import || ''),
        { overwrite: true }
      )
    )
  },
  { command: 'env:default' }
)
