import { cloneDeep, isEmpty, omitBy, unset } from 'lodash'
import { defineRepoTherapyWrapper as wrapper } from './wrapper'

function recursiveParse <T extends Record<string, object>> (
  pre: string,
  objDefination: RepoTherapyUtil.JsonDefination,
  data?: T
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const properties = Object.entries(objDefination)
    .map(([key, v]) => {
      const [_key, ...otherKey] = key.split(/(?<!\\\\)\./)
      return [_key, otherKey.length > 0 ? [otherKey.join('.'), v] : v]
    })
  const uniqueKey = Array.from(
    new Set(properties.map(([key]) => key.toString()))
  )
  const expectedProp = Object.fromEntries(uniqueKey.map((k) => {
    const actualKey = k.replace(/\\\\/g, '')
    const v = properties.filter(x => x[0] === k).map(x => x[1])
    if (!Array.isArray(v[0])) {
      if (v.length > 1) {
        throw new Error(
          `${actualKey} cannot be an object and non-object value at the ` +
          'same time'
        )
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let value: any = data && data[k]
      let sort = true
      const merge = true
      let dataType = 'string'
      if (typeof v[0] === 'object') {
        if (value === undefined) { value = v[0].default }
        sort = v[0].sort !== false
        if (v[0].type) { dataType = v[0].type }
      }
      if (!(typeof v[0] === 'object' ? v[0].optional : v[0])) {
        if (value === undefined) {
          throw new Error(`${pre}${actualKey} must be defined.`)
        }
        try {
          const [, arrayType] = /Array<(.*)>/.exec(dataType) || []
          if (arrayType) {
            if (!Array.isArray(value)) { throw new Error() }
            value.forEach(x => {
              // eslint-disable-next-line valid-typeof
              if (typeof x !== arrayType) { throw new Error() }
            })
            // eslint-disable-next-line valid-typeof
          } else if (typeof value !== dataType) { throw new Error() }
        } catch {
          throw new Error(`${pre}${actualKey} must ${dataType}.`)
        }
      }
      if (value && typeof v[0] === 'object') {
        if (dataType === 'object') {
          if (merge) {
            value = { ...(v[0].default as object || {}), ...value }
          }
          if (sort) {
            const defaultkeys = Object.keys(v[0].default || {})
            value = Object.fromEntries([
              ...defaultkeys,
              ...Object.keys(value || {}).filter(x => !defaultkeys.includes(x))
            ].map(x => [x, value[x]]))
          }
        } else if (/^Array<.*>$/.test(dataType)) {
          if (merge) {
            value = [...(v[0].default as typeof value || []), ...value]
          }
          if (sort) {
            const defaultArray = v[0].default as typeof value || []
            value = [
              ...defaultArray,
              ...(value as Array<string> || [])
                .filter(x => !defaultArray.includes(x))
            ]
          }
        }
      }
      return [actualKey, value]
    }
    return [actualKey, omitBy(recursiveParse(
      `${pre}${actualKey}.`,
      Object.fromEntries(
        v as Array<[string, RepoTherapyUtil.JsonDefinationDetail]>
      ),
      data ? data[k] as T : undefined
    ), value => typeof value !== 'boolean' && (
      value === undefined || value === null || isEmpty(value)
    ))]
  }))
  return {
    ...expectedProp,
    ...Object.fromEntries(
      Object.entries(data || {}).filter(([k]) => !uniqueKey.includes(k))
    )
  }
}

function recursiveMatch <
  T extends Record<string, object>
> (target: T, value?: T): Array<string> {
  const result = Object.entries(target).reduce((acc, [k, v]) => {
    if (typeof v === 'object' && !Array.isArray(v)) {
      if (value && (typeof value[k] !== 'object' || Array.isArray(v))) {
        throw new Error(`Data type of ${k} are different`)
      }
      acc.push(
        ...recursiveMatch(v as T, value && value[k] as T).map(x => `${k}.${x}`)
      )
    } else {
      if (Array.isArray(v)) {
        const _v = (value && value[k]) || []
        if (Array.isArray(_v)) {
          if (v.length === _v.length && !v.find((x, i) => x !== _v[i])) {
            acc.push(k)
          }
        }
      } else if (v === (value && value[k])) { acc.push(k) }
    }
    return acc
  }, [] as Array<string>)
  return result
}

export const f: typeof defineRepoTherapyJson = <
  T extends object
> (objDefination: RepoTherapyUtil.JsonDefination) => wrapper(
    'json',
    (data: T) => {
      const json = recursiveParse(
        '',
        objDefination,
        data as Record<string, object>
      ) as T
      function match (target: T) {
        return recursiveMatch(
          target as Record<string, object>,
          json as Record<string, object>
        )
      }
      return {
        json,
        match,
        difference: (target: T) => {
          const newJson = cloneDeep(json)
          match(target).forEach((k) => { unset(newJson, k) })
          return omitBy(newJson,
            value => (typeof value === 'object' && isEmpty(value)) ||
            value === undefined ||
            value === null
          ) as RepoTherapyUtil.DeepPartial<T>
        }
      }
    }
  )

export { f as defineRepoTherapyJson }
