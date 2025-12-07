// import standard from 'eslint-config-standard'
import { type ConfigWithExtends } from '@eslint/config-helpers'
import eslint from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import { type Linter } from 'eslint'
import { defineConfig } from 'eslint/config'
import standardJs from 'eslint-config-standard'
import eslintPluginImport from 'eslint-plugin-import'
import eslintPluginN from 'eslint-plugin-n'
import eslintPluginPromise from 'eslint-plugin-promise'
import tsLint from 'typescript-eslint'

import { importRepoTherapy } from '../util'
import { type CallableValue, resolveCallableValue } from '../../src/util'

type EslintConfig = Omit<ConfigWithExtends, 'files'>

interface LintOption {
  config?: {
    ts?: EslintConfig
    json?: EslintConfig
    md?: EslintConfig
    markdownLanguage?: EslintConfig
  },
  extend?: {
    ts?: boolean
    json?: boolean
    md?: boolean
    markdownLanguage?: boolean
  }
}

function configMerger (
  fileExtension: Array<string>,
  base: EslintConfig,
  parser: typeof tsParser,
  custom: EslintConfig = {}
): ConfigWithExtends {
  const config: ConfigWithExtends = Object.assign(base, custom, {
    languageOptions: { parser }
  })
  config.files = fileExtension.map(x => `**/*.${x}`)
  return config
}

export async function defineRepoTherapyLint (
  options: CallableValue<LintOption> = {}
) {
  const libTool = await importRepoTherapy().then(x => x())
  const customOptions = resolveCallableValue<LintOption>(options, libTool)

  const tsConfig = configMerger(
    ['ts', 'tsx', 'cts', 'mts', 'js', 'jsx', 'cjs', 'mjs'],
    {
      plugins: {
        import: eslintPluginImport,
        n: eslintPluginN,
        promise: eslintPluginPromise,
        '@typescript-eslint': tsPlugin
      } as unknown as Linter.Config['plugins'],
      rules: {
        ...eslint.configs.recommended.rules,
        ...standardJs.rules,
        ...tsLint.configs.recommended
          .reduce((acc, cur) => ({ ...acc, ...cur.rules }), {}),
        'max-len': ['error', {
          ignoreComments: true,
          ignoreRegExpLiterals: true
        }],
        'import/order': [
          'error',
          {
            groups: [
              'builtin',
              'external',
              'internal',
              ['parent', 'sibling'],
              'index',
              'object',
              'type'
            ],
            'newlines-between': 'always',
            alphabetize: {
              order: 'asc',
              caseInsensitive: true
            }
          }
        ]
      }
    },
    tsParser,
    customOptions.config?.ts
  )

  // todo html/xml md json
  return defineConfig([
    tsConfig
  ])
}
