import lint from './eslint/npm-lib.mjs'
import p from './package.json' with { type: 'json' }

export default lint(p.name)
