import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

export function tsconfig (projectType: RepoTherapy.ProjectType) {
  const dir = __dirname.replace(/\/node_modules\/.*$/, '')

  const path = join(dir, 'tsconfig.json')
  if (!existsSync(path)) { writeFileSync(path, '{}') }

  const p = JSON.parse(readFileSync(path, 'utf-8')) as {
    'ts-node'?: {
      files?: boolean
    }
    extends?: string
    compilerOptions?: {
      target?: string
      module?: string
      resolveJsonModule?: boolean
      esModuleInterop?: boolean
      forceConsistentCasingInFileNames?: boolean
      strict?: boolean
      skipLibCheck?: boolean
      outDir?: string
      rootDir?: string
      removeComments?: boolean
    }
  }

  if (projectType === 'knexpresso') {
    p.extends = './node_modules/knexpresso/tsconfig.json'
  } else {
    if (!p['ts-node']) { p['ts-node'] = {} }
    p['ts-node'].files = true
    if (!p.compilerOptions) { p.compilerOptions = {} }
    p.compilerOptions.target = 'es2016'
    p.compilerOptions.module = 'commonjs'
    p.compilerOptions.resolveJsonModule = true
    p.compilerOptions.esModuleInterop = true
    p.compilerOptions.forceConsistentCasingInFileNames = true
    p.compilerOptions.strict = true
    p.compilerOptions.skipLibCheck = true
    p.compilerOptions.outDir = projectType === 'npm-lib' ? './bin' : '.dist'
    p.compilerOptions.rootDir = './'
    p.compilerOptions.removeComments = true
  }
  writeFileSync(path, JSON.stringify(p, undefined, 2))
}
