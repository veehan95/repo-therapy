import { defineRepoTherapyScript } from '../defines/script'

export default defineRepoTherapyScript('Setup project.', async (a, libTool) => {
  libTool.printList('Generate from studs', await libTool.stud().generate())
}, {
  command: 'stud:generate'
})
