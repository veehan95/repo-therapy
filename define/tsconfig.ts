import { defineRepoTherapyImport } from './import'
import { defineRepoTherapyWrapper as wrapper } from './wrapper'
import { defineRepoTherapyJson } from './json'
import { writeFileSync } from 'fs'
import { cloneDeep, merge } from 'lodash'

export const f: typeof defineRepoTherapyTsconfig = (
  options = {}
) => wrapper('define-tsconfig', async (libTool) => {
  const path = options.path || 'tsconfig.json'

  const x = await defineRepoTherapyImport()()
    .importScript(path, { soft: true })
  const config: RepoTherapyUtil.DeepPartial<
    RepoTherapyUtil.TsConfigJson
  > = x.import || {}

  const extendConfig = config.extends
    ? await f({ path: config.extends })(libTool).then(x => x.config)
    : {}

  const c: RepoTherapyUtil.JsonDefination = {
    extends: true,
    'compilerOptions.target': { default: 'es2020' },
    'compilerOptions.module': { default: 'nodenext' },
    'compilerOptions.lib': {
      default: ['esnext', 'dom'],
      type: 'Array<string>'
    },
    'compilerOptions.allowJs': true,
    'compilerOptions.checkJs': true,
    'compilerOptions.jsx': true,
    'compilerOptions.declaration': { default: true, type: 'boolean' },
    'compilerOptions.declarationMap': { default: true, type: 'boolean' },
    'compilerOptions.sourceMap': { default: true, type: 'boolean' },
    'compilerOptions.outFile': true,
    'compilerOptions.outDir': {
      default: options.projectType === 'npm-lib' ? './bin' : '.dist'
    },
    'compilerOptions.rootDir': { default: './src' },
    'compilerOptions.composite': true,
    'compilerOptions.removeComments': { default: false, type: 'boolean' },
    'compilerOptions.noEmit': true,
    'compilerOptions.importHelpers': true,
    'compilerOptions.downlevelIteration': true,
    'compilerOptions.isolatedModules': true,
    'compilerOptions.strict': { default: true, type: 'boolean' },
    'compilerOptions.noImplicitAny': true,
    'compilerOptions.strictNullChecks': true,
    'compilerOptions.strictFunctionTypes': true,
    'compilerOptions.strictBindCallApply': true,
    'compilerOptions.strictPropertyInitialization': true,
    'compilerOptions.noImplicitThis': true,
    'compilerOptions.alwaysStrict': true,
    'compilerOptions.noUnusedLocals': true,
    'compilerOptions.noUnusedParameters': true,
    'compilerOptions.noImplicitReturns': true,
    'compilerOptions.noFallthroughCasesInSwitch': true,
    'compilerOptions.moduleResolution': { default: 'nodenext' },
    'compilerOptions.baseUrl': { default: './' },
    'compilerOptions.paths': true,
    'compilerOptions.rootDirs': true,
    'compilerOptions.typeRoots': true,
    'compilerOptions.types': true,
    'compilerOptions.allowSyntheticDefaultImports': true,
    'compilerOptions.esModuleInterop': { default: true, type: 'boolean' },
    'compilerOptions.preserveSymlinks': true,
    'compilerOptions.sourceRoot': true,
    'compilerOptions.mapRoot': true,
    'compilerOptions.inlineSourceMap': true,
    'compilerOptions.inlineSources': true,
    'compilerOptions.experimentalDecorators': true,
    'compilerOptions.emitDecoratorMetadata': true,
    'compilerOptions.skipLibCheck': true,
    'compilerOptions.forceConsistentCasingInFileNames': {
      default: true,
      type: 'boolean'
    },
    'compilerOptions.resolveJsonModule': { default: true, type: 'boolean' },
    include: {
      default: [
        '**/*.ts',
        'types/**/*.d.ts',
        'node_modules/**/types/**/*.d.ts'
      ],
      type: 'Array<string>',
      merge: true,
      sort: true
    }
  }
  if (options.allowTsNode !== false) {
    c['ts-node.files'] = { default: true, type: 'boolean' }
  }
  const json = defineRepoTherapyJson<RepoTherapyUtil.TsConfigJson>(c)(
    merge(cloneDeep(extendConfig), config) as RepoTherapyUtil.TsConfigJson
  )

  return {
    config,
    path: x.fullPath,
    write: () => {
      writeFileSync(x.fullPath, JSON.stringify(
        json.difference(extendConfig as RepoTherapyUtil.TsConfigJson),
        undefined,
        2
      ))
    }
  }
})

export { f as defineRepoTherapyTsconfig }
