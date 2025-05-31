import tseslint from 'typescript-eslint'
import config from './custom.mjs'

export default (libraryName) => tseslint.config(config('npm-lib', {
  ignore: [`.${libraryName}`]
}))
