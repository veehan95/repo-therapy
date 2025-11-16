import standard from 'eslint-config-standard'
import { join } from 'node:path'
import { defineRepoTherapyInternalWrapper as wrapper } from './wrapper'

const {
  parserOptions,
  env,
  globals
} = standard

export function defineRepoTherapyLint (
  // framework
) {
  return wrapper('lint', async (libTool) => {
    const eslintPath = join(libTool.path.root, 'eslint.config.ts')
    console.log(libTool.path.buildCache)
    console.log(eslintPath)
    const str = libTool.string().toScript([
      'import { defineConfig } from \'eslint/config\';',
      '',
      'export default defineConfig([',
      [
        '{',
        [
          'rules: {',
          [
            'semi: \'error\',',
            '\'prefer-const\': \'error\''
          ],
          '}'
        ],
        '}'
      ],
      ']);'
    ])
    console.log(str)
    // const vsCodeSettings = await vsCode(libTool).then(x => x.config.settings)
    // let lintWrap = (x: Linter.Config) => x
    // if (framework === 'nuxt-monorepo' || framework === 'nuxt.js') {
    //   lintWrap = await libTool.import<{
    //   default(
    //     x: Linter.Config
    //   ): Linter.Config
    // }>()
    //     .importScript('./.nuxt/eslint.config.mjs', { soft: true })
    //     .then(x => x.import?.default || ((x: Linter.Config) => x))
    // }

    return {
      // lint: () => lintWrap({
      //   rules,
      //   ignores: Object.keys((vsCodeSettings as {
      //   'files.exclude': Record<string, string>
      // })['files.exclude']).flatMap(x => [x, `${x}/**/*`]),
      //   files: [
      //     ...(presetFiles[projectType] || [])
      //   ],
      //   settings: {
      //     env: {
      //       ...env,
      //       browser: ['vue', 'nuxt', 'nuxt-monorepo'].includes(projectType),
      //       node: true,
      //       es2024: true
      //     }
      //   },
      //   plugins: {
      //     import: i,
      //     n,
      //     promise: p,
      //     ...((tseslint.configs.recommended[0] as unknown as {
      //     plugins: Record<string, string>
      //   })?.plugins || {})
      //   },
      //   languageOptions: {
      //     parser: (
      //     tseslint.configs.recommended[0] as unknown as {
      //       languageOptions?: { parser: Linter.Parser }
      //     }
      //     )?.languageOptions?.parser,
      //     parserOptions,
      //     globals
      //   }
      // })
    }
  })
}
