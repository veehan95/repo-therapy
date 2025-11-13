import { defineRepoTherapyScript } from '../defines/script'

export default defineRepoTherapyScript('Setup project.', (_, libTool) => {
  console.log(libTool.husky().setup())
}, {
  command: 'project:setup'
})
