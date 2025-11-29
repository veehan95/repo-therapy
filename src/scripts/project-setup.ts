import { defineRepoTherapyScript } from '../defines/script'

export default defineRepoTherapyScript('Setup project.', async (a, libTool) => {
  libTool.printList('Package.json', await libTool.packageJson().generate())
  libTool.printList('Husky hook', await libTool.husky().setup())
  libTool.printList('gitignore', await libTool.gitignore().generate())
  libTool.printList('VSCode', await libTool.vsCode().generate())
  libTool.printList('Typescript Config', await libTool.tsConfig().generate())
}, {
  command: 'project:setup'
})
