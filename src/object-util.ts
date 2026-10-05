import _ from 'lodash'
import { RepoTherapyUtilBase } from './base.js'
import type RepoTherapy from './repo-therapy.js'

export type Mapper = {
  keyMap: (value: string[]) => string[]
  keyRevert: (value: string[]) => string[]
}

export const baseMapper: Record<string, Mapper> = {
  env: {
    keyMap: (value) => value
      .flatMap(x => x.split(/(?<!_)__(?!_)/))
      .map(_.camelCase),
    keyRevert: (value) => [
      value.map(_.kebabCase).join('__').replace(/\-/g, '_').toUpperCase()
    ]
  }
}

export default class RTObjectUtil <
  T extends Record<string, {
    original: object
    final: object
  }> = {},
  CustomOptions extends object = {}
> extends RepoTherapyUtilBase<
  { util: Record<keyof T, Mapper> } & CustomOptions,
  RTObjectUtil<T, CustomOptions>
> {
  constructor (
    repoTherapy: RepoTherapy,
    options: { util: Record<keyof T, Mapper> } & CustomOptions
  ) {
    super(repoTherapy, options)
  }

  private _recursiveLoopToValue (value: object): [string[], unknown][] {
    return Object.entries(value).flatMap(([key, value]) => {
      if (typeof value === 'object' && !Array.isArray(value)) {
        return this._recursiveLoopToValue(value)
          .map(x => [[key, ...x[0]], x[1]]) as [string[], unknown][]
      }
      return [[[key], value]]
    })
  }

  private _restructure <
    Result extends object
  > (data: object, fn?: (value: string[]) => string[]) {
    if (!fn) { return data as Result }
    const keyDedup: string[][] = []
    const mapped = this._recursiveLoopToValue(data)
    let r = {} as Result
    for (const x of mapped) {
      const key = fn(x[0])
      const index = keyDedup.findIndex(
        (row) => row.length === key.length &&
          row.every((val, i) => val === key[i])
      );
      if (index >= 0) { throw new Error('fucked') }
      keyDedup.push(key)
      _.set(r, key, x[1])
    }
    return r
  }

  public map <
    Input extends object | 'soft',
    Outcome extends object,
    K extends keyof T = keyof T
  > (
    key: K,
    data: Input extends object
      ? Input
      : Input extends 'soft' ? object : T[K]['original']
  ): Outcome
  public map <
    Input extends object | 'soft',
    K extends keyof T = keyof T
  > (
    key: keyof T,
    data: Input extends object
      ? Input
      : Input extends 'soft' ? object : T[K]['original']
  ): T[K]['final']
  public map <
    Input extends object | 'soft',
    Outcome extends object,
    K extends keyof T = keyof T
  > (
    key: K,
    data: Input extends object
      ? Input
      : Input extends 'soft' ? object : T[K]['original']
  ) {
    return this._restructure<
      Outcome extends undefined ? T[K]['final']: Outcome
    >(data, this._options.util[key]?.keyMap)
  }

  public revert <
    Input extends object | 'soft',
    Outcome extends object,
    K extends keyof T = keyof T
  > (
    key: K,
    data: Input extends object
      ? Input
      : Input extends 'soft' ? object : T[K]['final']
  ): Outcome
  public revert <
    Input extends object | 'soft',
    K extends keyof T = keyof T
  > (
    key: K,
    data: Input extends object
      ? Input
      : Input extends 'soft' ? object : T[K]['final']
  ): T[K]['original']
  public revert <
    Input extends object | 'soft',
    Outcome extends object,
    K extends keyof T = keyof T
  > (
    key: K,
    data: Input extends object
      ? Input
      : Input extends 'soft' ? object : T[K]['final']
  ) {
    return this._restructure<
      Outcome extends object ? Outcome : T[K]['original']
    >(data, this._options.util[key]?.keyRevert)
  }

  public static define <
    T extends Record<string, {
      original: object
      final: object
    }>
  >(mapper: Record<keyof T, Mapper>) { return () => mapper }

  public static async loader (repoTherapy: RepoTherapy) {
    const typeDefinition: string[] = []
    const util = await repoTherapy
      .importScript<{
        default: ReturnType<typeof RTObjectUtil.define>
      }>(['object-util'], '/config/object-util.ts', true)
      .then(x => x.reduce((acc, mapper) => {
        typeDefinition.push(`import('${mapper.path}').Definition`)
        Object.entries(mapper.import.default())
          .forEach(([code, m]) => { if (!acc[code]) { acc[code] = m } })
        return acc
      }, baseMapper))

    const content = typeDefinition.length > 0
      ? typeDefinition.join(' &\n')
      : 'Record<string, { original: {}, final: {} }>'
    repoTherapy.generateFile(
      '/types/object-util.ts',
      `export type ObjectMapper = ${content} & {\n  ` +
      'env: {\n    original: {}\n    final: {}\n  }\n}'
    )
    return new RTObjectUtil(repoTherapy, { util })
  }
}
