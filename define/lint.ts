import { defineRepoTherapyWrapper as wrapper } from './wrapper'
import eslint from '@eslint/js'
import { type Linter } from 'eslint'
import tseslint from 'typescript-eslint'
import standard from 'eslint-config-standard'
import * as i from 'eslint-plugin-import'
import n from 'eslint-plugin-n'
import p from 'eslint-plugin-promise'
import { defineRepoTherapyVsCode } from './vscode'

const {
  parserOptions,
  env,
  globals,
  rules: standarRules
} = standard

const rules = {
  ...eslint.configs.recommended.rules,
  ...standarRules,
  ...tseslint.configs.recommended
    .reduce((acc, cur) => {
      if (!cur.rules) { return acc }
      Object.assign(acc, cur.rules)
      return acc
    }, {}),
  'max-len': [
    'error',
    {
      code: 80
    }
  ],
  '@typescript-eslint/no-unused-vars': [
    'error',
    { argsIgnorePattern: '^_' }
  ],
  // todo not vue
  'vue/multi-word-component-names': 'off'
}

const presetFilesBase = [
  '**/*.ts',
  '**/*.js',
  '**/*.mjs',
  '**/*.cjs',
  // todo not vue
  '**/*.vue'
]

const presetFiles = {
  // todo not vue
  frontend: presetFilesBase,
  backend: presetFilesBase,
  'npm-lib': presetFilesBase
}

const f: typeof defineRepoTherapyLint = ({
  projectType = 'npm-lib',
  framework,
  vsCode = defineRepoTherapyVsCode()
} = {}) => wrapper('define-lint', async (libTool) => {
  const vsCodeSettings = await vsCode(libTool).then(x => x.config.settings)
  let lintWrap = (x: Linter.Config) => x
  if (framework === 'nuxt-monorepo' || framework === 'nuxt.js') {
    lintWrap = await defineRepoTherapyImport<(
      x: Linter.Config
    ) => Linter.Config>()()
      .importScript('./.nuxt/eslint.config.mjs', { soft: true })
      .then(x => x.import) || ((x: Linter.Config) => x)
  }

  return {
    lint: () => lintWrap({
      rules,
      ignores: Object.keys((vsCodeSettings as {
        'files.exclude': Record<string, string>
      })['files.exclude']).flatMap(x => [x, `${x}/**/*`]),
      files: [
        ...(presetFiles[projectType] || [])
      ],
      settings: {
        env: {
          ...env,
          browser: ['vue', 'nuxt', 'nuxt-monorepo'].includes(projectType),
          node: true,
          es2024: true
        }
      },
      plugins: {
        import: i,
        n,
        promise: p,
        ...((tseslint.configs.recommended as unknown as {
          plugins: Record<string, string>
        })?.plugins || {})
      },
      languageOptions: {
        parser: (
          tseslint.configs.recommended[0] as unknown as {
            languageOptions?: { parser: Linter.Parser }
          }
        )?.languageOptions?.parser,
        parserOptions,
        globals
      }
    })
  }
})

export { f as defineRepoTherapyLint }
