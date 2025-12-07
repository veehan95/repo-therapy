import { defineRepoTherapyScript } from '../defines/script'

export default defineRepoTherapyScript('Setup project.', async (a, libTool) => {
  // libTool.printList('Package.json', await libTool.packageJson().generate())
  console.log(await libTool.stud().generate())
}, {
  command: 'stud:generate'
})
