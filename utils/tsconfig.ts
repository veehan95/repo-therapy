import { existsSync, readFileSync, writeFileSync } from 'fs'
import { extname, join } from 'path'

export function tsconfig (projectType: RepoTherapy.ProjectType) {
  const dir = join(
    __dirname,
    (extname(__filename) === '.js' ? '../' : '') + '../../../'
  )

  const path = join(dir, 'tsconfig.json')
  if (!existsSync(path)) { writeFileSync(path, '{}') }

  const p = JSON.parse(readFileSync(path, 'utf-8')) as {
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
  writeFileSync(path, JSON.stringify(p, undefined, 2))
}
