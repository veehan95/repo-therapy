import { defineRepoTherapyScript } from '../defines/script'

export default defineRepoTherapyScript('Setup project.', async (a, libTool) => {
  console.log(
    Object.entries(libTool.importConfig).map(([fileName, x]) => ({
      fileName,
      string: `export default ${x.default.name}({\n  // configure here\n})`
    }))
  )
  // libTool.printList('Generate from studs', await libTool.stud().generate())
}, {
  command: 'config:generate',
  builder: (a, libTool) => a
    .option('config', {
      describe: 'Config file to generate',
      alias: 'c',
      choices: Object.keys(libTool)
    })
})
