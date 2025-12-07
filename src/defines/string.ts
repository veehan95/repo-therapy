import { defineRepoTherapyInternalWrapper as wrapper } from './wrapper'
import { type Util } from '../../types/repo-therapy'

type ContentString = string | Array<ContentString>

export function defineRepoTherapyString () {
  function recursiveContent (str: ContentString): string {
    if (typeof str === 'string') { return str }
    return str.map(r => recursiveContent(r).replace(/\r|\n/g, '\n  '))
      .join('\n')
  }

  function objectRecursiveLoop (x: object): Array<[string, string]> {
    return Object.entries(x).flatMap(row => {
      if (!row[1]) { return [] }
      return typeof row[1] === 'object'
        ? objectRecursiveLoop(row[1])
          .map((arr) => [`${row[0]}.${arr[0]}`, arr[1]] as [string, string])
        : [[row[0], row[1].toString()]]
    })
  }

  const r = {
    toScript: (str: Array<ContentString>) => recursiveContent(str),
    mustacheReplace: (
      str: string,
      values: Record<string, Util.GenericType>
    ) => objectRecursiveLoop(values)
      .map(([k, v]) => [`{{${k}}}`, v])
      .reduce((acc, cur) => acc.replace(new RegExp(cur[0], 'g'), cur[1]), str)
  }

  return wrapper<typeof r, undefined, false>('string', () => r)
}
