import { cpSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { defineRepoTherapyEnv } from './env'
import { defineRepoTherapyError } from './error'
import { defineRepoTherapyGitignore } from './gitignore'
import { defineRepoTherapyHusky } from './husky'
import { defineRepoTherapyImport } from './import'
import { defineRepoTherapyJson } from './json'
import { defineRepoTherapyLint } from './lint'
import { defineRepoTherapyLogger } from './logger'
import { defineRepoTherapyPackageJson } from './package-json'
import { defineRepoTherapyScript } from './script'
import { defineRepoTherapyTsconfig } from './tsconfig'
import { defineRepoTherapyVsCode } from './vscode'
import { defineRepoTherapyWrapper as wrapper } from './wrapper'
import { defaultServerCodes } from '../config/index'

const f: typeof defineRepoTherapy = ({
  project,
  projectType,
  framework,
  logger = defineRepoTherapyLogger(),
  env: envConfig,
  serverCode = {},
  error = {},
  // todo move to @types
  manualModuleTyping = []
} = {}) => wrapper('define-repo-therapy', async () => {
  if (/\/node_modules\//.test(__dirname)) {
    const nodeModuleDir = __dirname
      .replace(/\/node_modules\/.*/g, '/node_modules')
    const typesDir = join(nodeModuleDir, '@types')
    if (!existsSync(typesDir)) { mkdirSync(typesDir) }
    ;['repo-therapy', ...manualModuleTyping].forEach((x) => {
      cpSync(
        join(__dirname, '../../types/'),
        join(typesDir, x),
        { recursive: true }
      )
    })
  }
  const p = await defineRepoTherapyImport<{ name: string }>()()
    .importScript('package.json')
  let _projectType: RepoTherapy.ProjectType | undefined = projectType
  const rootPath = await defineRepoTherapyImport()().rootPath
  const libTool = { rootPath } as unknown as RepoTherapy.DefineLibTool
  const definEnv = await defineRepoTherapyEnv((...x) => ({
    ...((envConfig ? envConfig(...x) : undefined) || {}),
    project: project || p.import?.name
  }))(libTool)
  Object.assign(libTool, { env: definEnv.env })
  Object.assign(libTool, { logger: logger(libTool).logger })
  // todo cleanup log
  if (definEnv.warning.length > 0) {
    definEnv.warning.forEach(async (x) => libTool.logger.warn(x))
  }

  const serverResponse = Object.entries(
    defaultServerCodes
  ).flatMap(([category, x]) => {
    return Object.entries(x as Record<string, RepoTherapyUtil.ServerCodeInfo>)
      .map(([name, { statusCode, defaultMessage }]) => {
        const customValue = serverCode[category] && (serverCode[
          category
        ] as Record<string, RepoTherapyUtil.ServerCodeInfo>)[name]
        return [statusCode, {
          name,
          category,
          isError: (customValue?.statusCode || statusCode) >= 400,
          defaultMessage: (customValue?.defaultMessage || defaultMessage)
        }] as [number, RepoTherapyUtil.ServerCodeConfig]
      })
  })
  const errorList = Object.fromEntries(([
    ...Object.entries(error),
    ...serverResponse.filter(([, v]) => v.isError)
      .map(([code, x]) => [x.name, { ...x, code }])
  ] as Array<[
    string,
    string | RepoTherapyUtil.ServerCodeConfig & { code: number }
  ]>).map(([name, x]) => {
    if (typeof x === 'string') {
      return [
        name,
        defineRepoTherapyError({ name, defaultMessage: x })()
      ]
    }
    return [name, defineRepoTherapyError({
      name,
      defaultMessage: x.defaultMessage,
      defaultProp: x
    })]
  }))

  let packageManager: RepoTherapy.PackageManager = 'yarn'
  try {
    await defineRepoTherapyImport()()
      .importScript('package-lock.json')
      .then(x => x.import)
    packageManager = 'npm'
  } catch {
    try {
      await defineRepoTherapyImport()()
        .importScript('pnpm-lock.yaml')
        .then(x => x.import)
      packageManager = 'pnpm'
    } catch {}
  }
  let _framework: Array<RepoTherapy.Framework> | undefined = framework
  const frameworkList: Record<
    RepoTherapy.ProjectType,
    Array<RepoTherapy.Framework>
  > = {
    frontend: ['nuxt.js', 'angular', 'svelte', 'vue.js', 'nuxt-monorepo'],
    backend: ['next.js', 'serverless', 'dynamodb', 'knexpresso'],
    'npm-lib': []
  }
  const packageJsonCache = await defineRepoTherapyPackageJson(
    { projectType: _projectType || 'npm-lib', packageManager }
  )(libTool)
  if (!_projectType || !_framework) {
    const dependencies = Object.keys(packageJsonCache.json.dependencies || {})
    if (!_projectType) {
      _projectType = (Object.entries(frameworkList).find(x => dependencies.find(
        y => x[1].includes(y as RepoTherapy.Framework)
      ))?.[0] || 'npm-lib') as RepoTherapy.ProjectType
    }
    if (!_framework) {
      _framework = Object.entries(frameworkList)
        .flatMap(x => dependencies.filter(
          y => x[1].includes(y as RepoTherapy.Framework)
        )) as Array<RepoTherapy.Framework>
    }
  }

  async function init () {
    await defineRepoTherapyPackageJson(
      { projectType: _projectType, packageManager }
    )(libTool).then(x => x.write())
    await defineRepoTherapyGitignore({ framework: _framework })(libTool)
      .then(x => x.write())
    await defineRepoTherapyTsconfig({ projectType: _projectType })(libTool)
      .then(x => x.write())
    await defineRepoTherapyVsCode({
      packageManager,
      framework: _framework
    })(libTool).then(x => x.write())
    defineRepoTherapyHusky({ packageManager })(libTool).setup()
  }

  return {
    init,
    rootPath: libTool.rootPath,
    env: libTool.env,
    serverCode: Object.fromEntries(serverResponse),
    error: errorList,
    newError: defineRepoTherapyError,
    logger: libTool.logger,
    lint: () => defineRepoTherapyLint()(libTool),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    wrapper: <T extends Function> (
      slug: `define-${string}`,
      func: T,
      warpperClient?: string
    ) => wrapper(slug, func, warpperClient),
    import: <T = object, U = string> (
      options: RepoTherapyUtil.DeepPartial<{
        encoding: BufferEncoding
        headers: U extends `${string}.csv` ? Array<string> : undefined
        accept: U extends `${string}.${
          'js' | 'cjs' | 'mjs' | 'jsx' | 'ts' | 'tsx'
        }`
          ? Record<string, keyof T | Array<keyof T>>
          : undefined
      }>
    ) => defineRepoTherapyImport(options),
    script: (...o) => (
      scriptname
    ) => defineRepoTherapyScript(...o)(libTool, scriptname),
    json: defineRepoTherapyJson,
    packageJson: packageJsonCache.json
  }
})

export { f as defineRepoTherapy }
