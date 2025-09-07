import { type Linter } from 'eslint'
import tseslint from 'typescript-eslint'
import standard from 'eslint-config-standard'
import * as i from 'eslint-plugin-import'
import n from 'eslint-plugin-n'
import p from 'eslint-plugin-promise'
import { defineRepoTherapyWrapper as wrapper } from './wrapper'
import { defineRepoTherapyVsCode } from './vscode'
import { rules, presetFiles } from '../config/lint'

const {
  parserOptions,
  env,
  globals
} = standard

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
        ...((tseslint.configs.recommended[0] as unknown as {
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
