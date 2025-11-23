import { defineRepoTherapyScript, type ScriptLibTool } from '../defines/script'

interface Argv {
  project?: string
  env?: string
}

export async function generate (a: Argv, libTool: ScriptLibTool) {
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
}

export default defineRepoTherapyScript<Argv>(
  'Set default env.',
  async (a, libTool) => { generate(a, libTool) },
  { command: 'env:default' }
)
