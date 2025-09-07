import { execSync } from 'child_process'

export function config (
  env: RepoTherapy.Env,
  projectType: RepoTherapy.ProjectType,
  packageManager: RepoTherapy.PackageManager
): RepoTherapyUtil.JsonDefination {
  const nodeVersion = execSync('node --version').toString().trim()
  const packageManagerVersion = execSync(`${packageManager} --version`)
    .toString().trim()
  const url = execSync('git config --get remote.origin.url')
    .toString()
    .trim()
  const domainRegExp = /git@((?!:).+):/
  const [, domain] = /git@((?!:).+):/.exec(url) || []
  const gitUrl = 'git+' + url.replace(domainRegExp, `https://${domain}/`)
    .replace(/.git$/, '')

  return {
    name: { default: env.project },
    version: { default: '0.0.1' },
    'scripts.lint': { default: 'eslint .' },
    'scripts.postinstall': { default: 'husky' },
    ...(
      projectType === 'npm-lib'
        ? {
            'scripts.pre-publish': { default: 'rm -rf bin && tsc' },
            'scripts.publish': { default: 'yarn pre-publish && npm publish' },
            main: { default: './bin/index.js' },
            types: { default: './bin/index.d.ts' },
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
}
