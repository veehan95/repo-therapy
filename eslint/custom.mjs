import eslint from '@eslint/js'
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

export const rules = {
  ...eslint.configs.recommended.reuls,
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
  ]
}

export const presetIgnore = {
  backend: ['.dist/**/*'],
  'npm-lib': ['bin/**/*']
}

export const presetFilesBase = [
  '**/*.ts',
  '**/*.js',
  '**/*.mjs',
  '**/*.cjs'
]

export const presetFiles = {
  backend: presetFilesBase,
  'npm-lib': presetFilesBase
}

export default (projectType, { ignores: _ignores, files } = {}) => {
  const ignores = [
    '.gitlab/**/*',
    '.husky/**/*',
    'node_modules/**/*',
    ...(presetIgnore[projectType] || []),
    ...(_ignores || [])
  ]

  return {
    rules,
    ignores,
    files: [
      ...(presetFiles[projectType] || []),
      ...(files || [])
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
      parser: tseslint.configs.recommended[0].languageOptions.parser,
      parserOptions,
      globals
    }
  }
}
