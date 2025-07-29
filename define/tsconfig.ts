// import { existsSync, readFileSync, writeFileSync } from 'fs'
// import { join } from 'path'
// import { type CompilerOptions } from 'typescript'
// import { type TsConfigOptions } from 'ts-node'


// // todo to finish
// export const _defineRepoTherapyTsconfig: typeof defineRepoTherapyTsconfig = (
//   handler
// ) => () => {
//   const h = handler()

//   const path = h.path || 'tsconfig.json'
//   const fullPath = join(h.rootPath, path)
//   const p = JSON.parse(readFileSync(path, 'utf-8')) as Partial<{
//     'ts-node': TsConfigOptions
//     compilerOptions: Partial<CompilerOptions>
//     extends: string
//   }>
//   if (h.extends) { p.extends = h.extends }
//   if (h.allowTsNode) { p['ts-node'] = { files: true } }
//   if (!p.compilerOptions) { p.compilerOptions = {} }
//   // // p.compilerOptions.target = 'es2016'
//   // // p.compilerOptions.module = 'commonjs'
//   // p.compilerOptions.resolveJsonModule = true
//   // p.compilerOptions.esModuleInterop = true
//   // p.compilerOptions.forceConsistentCasingInFileNames = true
//   // p.compilerOptions.strict = true
//   // p.compilerOptions.skipLibCheck = true
//   // p.compilerOptions.outDir = projectType === 'npm-lib' ? './bin' : '.dist'
//   // p.compilerOptions.rootDir = './'
//   // p.compilerOptions.removeComments = true
//   // p.compilerOptions.declaration = true
//   // p.compilerOptions.declarationMap = true
//   // p.compilerOptions.emitDeclarationOnly = false
// }
