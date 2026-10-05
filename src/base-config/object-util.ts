import _ from 'lodash'
import RTObjectUtil from '../object-util.js'

export type Definition = {
  env: {
    original: {}
    final: {}
  }
}

export default RTObjectUtil.define<Definition>({
  env: {
    keyMap: (value) => value
      .flatMap(x => x.split(/(?<!_)__(?!_)/))
      .map(_.camelCase),
    keyRevert: (value) => [
      value.map(_.kebabCase).join('__').replace(/\-/g, '_').toUpperCase()
    ]
  }
})
