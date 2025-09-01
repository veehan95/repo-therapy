import { defineRepoTherapyWrapper as wrapper } from './wrapper'
import { defineRepoTherapyImport } from './import'
import { writeFileSync } from 'fs'
import { defineRepoTherapyJson } from './json'
import { execSync } from 'child_process'
// import libPackageJson from '../package.json'
import { type PackageJson } from 'type-fest'

const f: typeof defineRepoTherapyPackageJson = ({
  path,
  projectType,
  packageManager = 'yarn'
} = {}) => wrapper('define-package-json', async ({ env }) => {
  const jsonPath = path || 'package.json'
  const packageJson = await defineRepoTherapyImport()()
    .importScript(jsonPath, { soft: true })

  const url = execSync('git config --get remote.origin.url')
    .toString()
    .trim()
  const domainRegExp = /git@((?!:).+):/
  const [, domain] = /git@((?!:).+):/.exec(url) || []
  const gitUrl = 'git+' + url.replace(domainRegExp, `https://${domain}/`)
    .replace(/.git$/, '')

  const nodeVersion = execSync('node --version').toString().trim()

  const packageManagerVersion = execSync(`${packageManager} --version`)
    .toString().trim()

  const config: RepoTherapyUtil.JsonDefination = {
    name: { default: env.project },
    version: { default: '0.0.1' },
    'scripts.lint': { default: 'eslint .' },
    'scripts.postinstall': { default: 'husky' },
    ...(
      projectType === 'npm-lib'
        ? {
            'scripts.pre-publish': { default: 'rm -rf bin && tsc' },
            main: { default: './bin/index.js' },
            types: { default: './types.d/index.d.ts' },
            files: {
              default: ['bin', 'types'],
              merge: true,
              sort: true,
              type: 'Array<string>'
            },
            [`bin.${env.project}`]: { default: './bin/cli.js' }
          }
        : {}
    ),
    'repository.type': { default: 'git' },
    'repository.url': { default: gitUrl },
    // 'dependencies.eslint': { default: libPackageJson.dependencies.eslint },
    // 'dependencies.eslint-config-standard': {
    //   default: libPackageJson.dependencies['eslint-config-standard']
    // },
    // 'dependencies.eslint-plugin-import': {
    //   default: libPackageJson.dependencies['eslint-plugin-import']
    // },
    // 'dependencies.eslint-plugin-n': {
    //   default: libPackageJson.dependencies['eslint-plugin-n']
    // },
    // 'dependencies.eslint-plugin-promise': {
    //   default: libPackageJson.dependencies['eslint-plugin-promise']
    // },
    // 'dependencies.husky': { default: libPackageJson.dependencies.husky },
    dependencies: { default: {}, type: 'object' },
    devDependencies: { optional: true, type: 'object' },
    peerDependencies: { optional: true, type: 'object' },
    optionalDependencies: { optional: true, type: 'object' },
    'engines.node': { default: `>=${nodeVersion}` },
    [`engines.${packageManager}`]: { default: `>=${packageManagerVersion}` },
    private: { default: projectType !== 'npm-lib', type: 'boolean' },
    'publishConfig.registry': { default: 'https://registry.npmjs.org/' },
    'publishConfig.access': { default: 'public' },
    'publishConfig.strict-ssl': { default: false, type: 'boolean' },
    license: { default: 'MIT' }
  }
  const data = defineRepoTherapyJson(config)(packageJson.import || {})
    .json as PackageJson.PackageJsonStandard

  return {
    path: packageJson.fullPath,
    json: data,
    write: () => {
      writeFileSync(packageJson.fullPath, JSON.stringify(data, undefined, 2))
    }
  }
})

export { f as defineRepoTherapyPackageJson }
