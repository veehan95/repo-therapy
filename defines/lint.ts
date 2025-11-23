// import standard from 'eslint-config-standard'
import { join } from 'node:path'
import { Util } from 'types/repo-therapy'
import { defineRepoTherapyInternalWrapper as wrapper } from './wrapper'

// const {
//   parserOptions,
//   env,
//   globals
// } = standard
// todo
export function defineRepoTherapyLint (
  o?: any// framework
) {
  return wrapper('', (libTool) => {
    // const eslintPath = join(libTool.path.root, 'eslint.config.ts')
    console.log(libTool.path)
    // console.log(eslintPath)
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
      generate: async () => {
        await libTool.importLib.writeStatic(
          join(libTool.path.buildCache, '/eslint.config.ts') as Util.Path,
          () => libTool.string().toScript([
            'import { defineConfig } from \'eslint/config\'',
            `import config from '.${
              libTool.path.buildCache
            }/eslint.config'`,
            '',
            'export default defineConfig(config)'
          ])
        )
      }
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
