import { execSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { extname, join } from 'path'
import packageSort from 'sort-package-json'

export function packageJson (projectType: RepoTherapy.ProjectType) {
  const dir = join(
    __dirname,
    (extname(__filename) === '.js' ? '../' : '') + '../../../'
  )

  const path = join(dir, 'package.json')
  if (!existsSync(path)) { writeFileSync(path, '{}') }

  const p = JSON.parse(readFileSync(path, 'utf-8')) as {
    name: string
    repository?: {
      type: string
      url: string
    },
    license?: string
    main?: string
    bin?: Record<string, string>
    scripts?: Record<string, string>
  }
  if (!p.license) { p.license = 'MIT' }

  if (!p.scripts) { p.scripts = {} }
  if (!p.scripts.postinstall) { p.scripts.postinstall = '' }

  if (projectType === 'npm-lib') {
    p.scripts['pre-publish'] = 'yarn tsc'
    if (!p.repository) {
      p.repository = { type: '', url: '' }
    }
    p.repository.type = 'git'
    const url = execSync('git config --get remote.origin.url')
      .toString()
      .trim()
    const domainRegExp = /git@((?!:).+):/
    const [, domain] = /git@((?!:).+):/.exec(url) || []
    p.repository.url = 'git+' + url.replace(domainRegExp, `https://${domain}/`)
      .replace(/.git$/, '')
    if (!p.main) { p.main = './bin/index.js' }
    if (!p.bin) { p.bin = {} }
    if (!p.bin[p.name]) { p.bin[p.name] = './bin/cli.js' }
  } else if (projectType === 'knexpresso') {
    p.scripts.build = 'knexpresso build'
    p.scripts.start = 'knexpresso start'
    p.scripts.dev = 'knexpresso dev'
    p.scripts.script = 'knexpresso script'
    p.scripts.postinstall += 'knexpresso'
  }

  p.scripts.lint = 'yarn eslint .'
  if (!/^(.*\s)?husky(\s.*)?$/.test(p.scripts.postinstall)) {
    if (p.scripts.postinstall) { p.scripts.postinstall += ' && ' }
    p.scripts.postinstall += 'husky'
  }

  writeFileSync(
    path,
    JSON.stringify(packageSort(p), undefined, 2)
  )
}
