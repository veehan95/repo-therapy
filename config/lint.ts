import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import standard from 'eslint-config-standard'

const {
  rules: standarRules
} = standard

export const rules = {
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

export const presetFiles = {
  // todo not vue
  frontend: presetFilesBase,
  backend: presetFilesBase,
  'npm-lib': presetFilesBase
}
