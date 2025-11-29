import lodash, { startCase } from 'lodash'

import { defineRepoTherapyValue } from './value'
import { defineRepoTherapyInternalWrapper as wrapper } from './wrapper'
import { type Util } from '../types/repo-therapy'

type ValueBase = ReturnType<ReturnType<typeof defineRepoTherapyValue>>

export type ValueCallback = ReturnType<ValueBase[keyof ValueBase]>

export type ValueDefination = { [s: string]: ValueDefination | ValueCallback }

type ValueDefinationRecursive <T extends ValueDefination> = {
  [s in keyof T]: T[s] extends ValueCallback
    ? ReturnType<T[s]>
    : T[s] extends ValueDefination
      ? ValueDefinationRecursive<T[s]>
      : never
}

export interface ValueParseOptions {
  query?: (
    v: Record<string, Util.GenericType>,
    arr: Array<string>
  ) => Util.GenericType
  interfaceName?: string
}

export function defineRepoTherapyValueParse <
  DefinedDefination extends ValueDefination = ValueDefination
> (defination: DefinedDefination, {
  query = (o, kList) => lodash.get(o, kList),
  interfaceName
}: ValueParseOptions = {}) {
  function get (
    value: Record<string, Util.GenericType>,
    sample = false
  ) {
    function recursiveObject <T extends ValueDefination> (
      o: ValueDefination,
      kList: Array<string> = []
    ): ValueDefinationRecursive<T> {
      const objArr = Object.entries(o)
      const arr = []
      for (const i in objArr) {
        const [k, v] = objArr[i]
        const newKList = [...kList, k]
        if (typeof v === 'object') {
          const result = recursiveObject(v, newKList)
          if (!lodash.isEmpty(result)) { arr.push([k, result]) }
          continue
        }
        if (sample) {
          const config = v.getConfig()
          arr.push([
            k,
            query(value, newKList) ||
            config.defaultValue ||
            `<${config.typeDeclaration}>`
          ])
          continue
        }
        // todo if multiple v() will throw error for no reason
        arr.push([k, v(newKList.join('.'), query(value, newKList))])
      }
      return Object.fromEntries(arr) as ValueDefinationRecursive<T>
    }
    return recursiveObject<DefinedDefination>(defination)
  }

  function getType () {
    if (!interfaceName) { throw new Error('Misisng interface name.') }

    const predefine: Array<string> = []
    function recursiveObjectType <T extends ValueDefination> (
      o: T
    ): string {
      return Object.entries(o).flatMap(([k, v]) => {
        if (typeof v === 'object') {
          return [
                `${k}: {`,
                ...recursiveObjectType(v)
                  .split('\n')
                  .map(s => `  ${s}`),
                '}'
          ]
        }
        const config = v.getConfig()
        let typeDeclaration = config.typeDeclaration
        if (/\|/g.test(typeDeclaration)) {
          typeDeclaration = startCase(k).replace(/\s/g, '')
          predefine.push(...config.typeDeclaration
            .split(/ \| /g)
            .reduce((acc, cur, i, arr) => {
              if ((acc[acc.length - 1].length + cur.length) <= 76) {
                acc[acc.length - 1] += ` ${cur}`
              } else { acc.push('  ' + cur) }
              if ((arr.length - 1) > i) { acc[acc.length - 1] += ' |' }
              return acc
            }, [`type ${typeDeclaration} =`])
          )
        }
        const desc = config.description && config.description.length > 0
          ? typeof config.description === 'string'
            ? `/* ${config.description} */\n`
            : config.description.length > 1
              ? `/*\n * ${config.description.join('\n * ')}\n */\n`
              : `/* ${config.description[0]} */\n`
          : undefined
        return `${desc}${k}${config.optional ? '?' : ''}: ${typeDeclaration}`
      }).join('\n')
    }

    const interfaceStr = [
      `interface ${startCase(interfaceName).replace(/\s/g, '')} {`,
      ...recursiveObjectType(defination)
        .split('\n')
        .map(s => `  ${s}`),
      '}'
    ].join('\n')
    return (predefine.length > 0 ? predefine.join('\n') + '\n' : '') +
      interfaceStr
  }

  const r = {
    getType,
    generateSample: (sampleValue = {}) => get(sampleValue, true),
    get,
    isOptional: (kList: Array<string>) => (
        lodash.get(defination, kList) as ValueCallback
    ).getConfig().optional,
    defaultValue: (kList: Array<string>) => (
        lodash.get(defination, kList) as ValueCallback
    ).getConfig().defaultValue
  }

  return wrapper<typeof r, undefined, false>('env', () => r)
}
