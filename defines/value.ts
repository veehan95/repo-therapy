import { type Util } from '../types/repo-therapy'
import { defineRepoTherapyInternalWrapper as wrapper } from './wrapper'

export function defineRepoTherapyValue <T extends Util.GenericType> (
  description: string | Array<string>
) {
  function isCustom (
    validator: (v: Util.GenericType) => void,
    { size, sizeUnit, typeDeclaration }: {
      size?: (v: Util.GenericType) => number
      sizeUnit?: string
      typeDeclaration: string

    }
  ) {
    const config: {
      defaultValue?: T
      nullable?: boolean
      min?: number
      max?: number
      typeDeclaration: string
      description: string | Array<string>
    } = { typeDeclaration, description }

    function validate (p: string, v?: Util.GenericType): T {
      const value = v || config.defaultValue
      try {
        if (!config.nullable && value === undefined) {
          throw new Error('must have a value')
        }
        validator(value)
        if (size) {
          const s = size(value)
          if (config.max !== undefined && s > config.max) {
            throw new Error(`${
                sizeUnit ? `${sizeUnit} ` : ''
              }must be less than ${config.max}`)
          }
          if (config.min !== undefined && s < config.min) {
            throw new Error(`${
                sizeUnit ? `${sizeUnit} ` : ''
              }must be more than ${config.min}`)
          }
        }
      } catch (e) { throw new Error(`${p} ${(e as Error).message}.`) }
      return value as T
    }
    const r = Object.assign(validate, {
      nullable: () => {
        config.nullable = true
        return r
      },
      defaultTo: (v: T) => {
        config.defaultValue = v
        return r
      },
      min: (v: number) => {
        config.min = v
        return r
      },
      max: (v: number) => {
        config.max = v
        return r
      },
      getConfig: () => Object.assign({
        optional: !!(config.nullable || config.defaultValue)
      }, config)
    })
    return r
  }

  function isNumber (callback?: (v: number) => number) {
    return isCustom((v: Util.GenericType) => {
      const parseV = Number(v)
      if (typeof parseV !== 'number' || isNaN(parseV)) {
        throw new Error('not a number')
      }
      return callback ? callback(parseV) : parseV
    }, {
      size (v) { return v as number },
      typeDeclaration: 'number'
    })
  }

  function isInteger (callback?: (v: number) => number) {
    return isNumber(n => {
      if (n % 1 !== 0) { throw new Error('not a integer') }
      return callback ? callback(n) : n
    })
  }

  const r = {
    isCustom,
    isString: (
      match?: RegExp,
      typeDeclaration = 'string'
    ) => isCustom((v: Util.GenericType) => {
      if (typeof v !== 'string') { throw new Error('not a string') }
      if (match && !match.test(v)) {
        throw new Error(`doesn't match ${match}`)
      }
      return v
    }, {
      size (v) { return v!.toString().length },
      sizeUnit: 'length',
      typeDeclaration
    }),
    isNumber: () => isNumber(),
    isPositiveNumber: () => isNumber((n) => {
      if (n < 0) { throw new Error('not a positive number') }
      return n
    }),
    isNegativeNumber: () => isNumber((n) => {
      if (n > 0) { throw new Error('not a positive number') }
      return n
    }),
    isInteger: () => isInteger(),
    isPositiveInteger: () => isInteger((n) => {
      if (n < 0) { throw new Error('not a positive integer') }
      return n
    }),
    isNegativeInteger: () => isInteger((n) => {
      if (n > 0) { throw new Error('not a positive integer') }
      return n
    }),
    isBoolean: () => isCustom((v: Util.GenericType) => {
      if (typeof v !== 'boolean') { throw new Error('not a boolean') }
      return v
    }, { typeDeclaration: 'boolean' }),
    isOneOf: <Value extends Record<string, string | number | boolean>> (
      enumObj: Value
    ) => isCustom((v: Util.GenericType) => {
      if (!enumObj[v as keyof Value]) {
        throw new Error(`not a value in ${
            Object.values(enumObj).join(' | ')
          }`)
      }
      return v
    }, {
      typeDeclaration: ((
        JSON.stringify(Object.values(enumObj)).match(/^\[(.*)\]$/) || []
      )[1] || '').replace(/"/g, '\'').replace(/,/g, ' | ')
    })
  }

  return wrapper<typeof r, undefined, false>('env', () => r)
}
