import tseslint from 'typescript-eslint'
import config from './custom.mjs'

export default () => tseslint.config(config('backend'))
