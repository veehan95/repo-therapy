import { defineRepoTherapyScript } from '../defines/script'

export default defineRepoTherapyScript('Set default env.', (_, libTool) => {
  console.log(libTool)
}, {
  command: 'env:default <project>'
})
