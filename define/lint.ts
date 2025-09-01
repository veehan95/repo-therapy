import { defineRepoTherapyWrapper as wrapper } from './wrapper'
import eslint from '@eslint/js'
import { type Linter } from 'eslint'
import tseslint from 'typescript-eslint'
import standard from 'eslint-config-standard'
import i from 'eslint-plugin-import'
import n from 'eslint-plugin-n'
import p from 'eslint-plugin-promise'

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
  ignores = []
} = {}) => wrapper('define-lint', async () => {
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
      ignores,
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
        ...tseslint.configs.recommended[0].plugins
      },
      languageOptions: {
        parser: tseslint.configs.recommended[0].languageOptions
          ?.parser as Linter.Parser,
        parserOptions,
        globals
      }
    })
  }
})

export { f as defineRepoTherapyHusky }
