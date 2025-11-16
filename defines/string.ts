import { defineRepoTherapyInternalWrapper as wrapper } from './wrapper'

type ContentString = string | Array<ContentString>

export function defineRepoTherapyString () {
  function recursiveContent (str: ContentString): string {
    if (typeof str === 'string') { return str }
    return str.map(r => recursiveContent(r).replace(/\r|\n/g, '\n  '))
      .join('\n')
  }

  const r = {
    toScript: (str: Array<ContentString>) => recursiveContent(str)
  }

  return wrapper<typeof r, undefined, false>('string', () => r)
}
