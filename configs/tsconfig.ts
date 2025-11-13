export function config (
  projectType: RepoTherapy.ProjectType = 'npm-lib'
): RepoTherapyUtil.JsonDefination {
  return {
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
      default: projectType === 'npm-lib' ? './bin' : '.dist'
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
}
