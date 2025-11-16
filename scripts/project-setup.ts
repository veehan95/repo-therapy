import { defineRepoTherapyScript } from '../defines/script'

export default defineRepoTherapyScript<{
  description?: string
}>('Setup project.', async (a, libTool) => {
  libTool.printList('Package.json', await libTool.packageJson(
    { description: a.description }
  ).then(x => x.generate()))
  libTool.printList('Husky hook', await libTool.husky().setup())
  libTool.printList('gitignore', await libTool.gitignore().generate())
  libTool.printList('VSCode', await libTool.vsCode().generate())
}, {
  command: 'project:setup',
  builder: (a) => a
    .option('description', {
      describe: 'Project description',
      alias: 'd',
      type: 'string'
    })
})
