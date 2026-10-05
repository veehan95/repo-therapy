import { z } from 'zod'
import _ from 'lodash'
import RTDocumentedError from './error.js'
import RTValueTypeBase from './value-type.js'
import type RepoTherapy from './repo-therapy.js'
import type { Options } from './value-type.js'
import type { ObjectDefinition } from './types.js'

export type StringMeta = {
  default?: string
  optional?: boolean
  minLength?: number
  maxLength?: number
  exactLength?: number
  oneOf?: string[]
}

export class RTValueTypeString <
  Metadata extends Record<string, unknown> = {},
  CustomOptions extends object = {},
  Self extends RTValueTypeString<Metadata, CustomOptions, Self, keyof Self> =
    RTValueTypeString<Metadata, CustomOptions, any, any>,
  ForceReturn extends keyof Self = keyof Self
> extends RTValueTypeBase<
  string,
  StringMeta & Metadata,
  CustomOptions,
  Self,
  ForceReturn
> {
  protected _baseType = 'string' as const

  protected _type = 'string'

  protected _unstrict = String

  constructor (
    repoTherapy: RepoTherapy,
    description: string,
    options: CustomOptions &
      Partial<Options<string, StringMeta & Metadata, CustomOptions, Self>>
        = {} as CustomOptions
  ) {
    super(repoTherapy, description, {
      ...options,
      metadata: {
        ...(options.metadata || {}),
        default: undefined,
        optional: false,
        minLength: undefined,
        maxLength: undefined,
        exactLength: undefined,
        oneOf: undefined
      }
    })
  }

  protected _minLength (minLength: number) {
    if (
      this._options.metadata.maxLength === undefined ||
      minLength < this._options.metadata.maxLength
    ) { return }
    throw new this.errorClass('server_conflicting_configuration', {
      message: `minLength (${minLength}) is greater than or equal maxLength (${
        this._options.metadata.maxLength
      })`
    })
  }

  protected _maxLength (maxLength: number) {
    if (
      this._options.metadata.minLength === undefined ||
      maxLength > this._options.metadata.minLength
    ) { return }
    throw new this.errorClass('server_conflicting_configuration', {
      message: `maxLength (${maxLength}) is less than or equal minLength (${
        this._options.metadata.minLength
      })`
    })
  }

  protected _exactLength () {
    if (
      this._options.metadata.minLength === undefined &&
      this._options.metadata.maxLength === undefined
    ) { return }
    throw new this.errorClass('server_conflicting_configuration', {
      message: 'minLength or maxLength configured'
    })
  }

  protected _init () {
    let schema = z.string()

    if (this._options.metadata.minLength !== undefined) {
      schema = schema.min(
        this._options.metadata.minLength,
        `Expected string with at least ${this._options.metadata.minLength} characters`
      )
    }

    if (this._options.metadata.maxLength !== undefined) {
      schema = schema.max(
        this._options.metadata.maxLength,
        `Expected string with at most ${this._options.metadata.maxLength} characters`
      )
    }

    if (this._options.metadata.exactLength !== undefined) {
      schema = schema.length(
        this._options.metadata.exactLength,
        `Expected string with exactly ${this._options.metadata.exactLength} characters`
      )
    }

    if (this._options.metadata.oneOf) {
      schema = schema.refine((x) => this._options.metadata.oneOf!.includes(x), {
        message: `Expected one of [${this._options.metadata.oneOf.join(', ')}]`,
        params: {
          code: 'invalid_option',
          expected: `[${this._options.metadata.oneOf.join(', ')}]`
        }
      })
    }

    return schema
  }
}

export type NumberMeta = {
  default?: number
  optional?: boolean
  decimals?: number
  sign?: 'positive' | 'negative' | 'non-positive' | 'non-negative'
  min?: number
  max?: number
  oneOf?: number[] 
}

export class RTValueTypeNumber <
  Metadata extends Record<string, unknown> = {},
  CustomOptions extends object = {},
  Self extends RTValueTypeNumber<Metadata, CustomOptions, Self, keyof Self> =
    RTValueTypeNumber<Metadata, CustomOptions, any, any>,
  ForceReturn extends keyof Self = keyof Self
> extends RTValueTypeBase<
  number,
  NumberMeta & Metadata,
  CustomOptions,
  Self,
  ForceReturn
> {
  protected _baseType = 'number' as const

  protected _type: string = 'number'

  protected _unstrict (value: unknown) { return Number(value) }

  constructor (
    repoTherapy: RepoTherapy,
    description: string,
    options: CustomOptions &
      Partial<Options<number, NumberMeta & Metadata, CustomOptions, Self>>
        = {} as CustomOptions
  ) {
    super(repoTherapy, description, {
      ...options,
      metadata: {
        ...(options.metadata || {}),
        default: undefined,
        optional: false,
        decimals: undefined,
        sign: undefined,
        min: undefined,
        max: undefined,
        oneOf: undefined
      }
    })
  }

  integer () {
    if (this._type !== 'number') {
      throw new this.errorClass('server_conflicting_configuration', {
        fields: ['integer']
      }, this.integer)
    }
    this._type = 'int'
  }

  float (decimals?: number) {
    if (this._type !== 'number') {
      throw new this.errorClass('server_conflicting_configuration', {
        fields: ['float']
      }, this.float)
    }
    this._type = 'float'
    this._options.metadata.decimals = decimals
  }

  // protected _min (min: number) {
  //   if (
  //     this._options.metadata.max === undefined ||
  //     min < this._options.metadata.max
  //   ) { return }
  //   throw new this.error('server_conflicting_configuration', {
  //     fields: ['integer']
  //   }, this.integer)
  // }

  // protected _max (max: number) {
  //   if (
  //     this._options.metadata.min === undefined ||
  //     max > this._options.metadata.min
  //   ) { return }
  //   throw new ServerErrorInternalServerError('conflicting_configuration', {
  //     message: `${max} is less than or equal ${this._options.min}`
  //   })
  // }

  _init () {
    let schema
    switch (this._type) {
      case 'number':
        schema = z.number()
        break
      case 'int':
        schema = z.int()
        break
      case 'float':
        schema = this._options.metadata.decimals === undefined
          ? z.number()
          : z.number().refine(
            (x) => !Number.isNaN(Number(x)) && (
              x.toString().split('.')[1] ?? ''
            ).length <= this._options.metadata.decimals!,
            `Expected a float with at most ${
              this._options.metadata.decimals
            } decimal places`
          )
        break
      default:
        throw new this.errorClass('server_configuration_undefined', {
          fields: ['number type', this._type]
        }, this._init)
    }

    switch (this._options.metadata.sign) {
      case 'positive':
        schema = schema.positive()
        break
      case 'negative':
        schema = schema.negative()
        break
      case 'non-positive':
        schema = schema.nonpositive()
        break
      case 'non-negative':
        schema = schema.nonnegative()
        break
    }

    // if (this._options.min !== undefined) {
    //   schema = schema.refine((x) => x >= this._options.metadata.min!, `Expected to be not less than ${this._options.min}`)
    // }

    // if (this._options.max !== undefined) {
    //   schema = schema.refine((x) => x <= this._options.metadata.max!, `Expected to be not more than ${this._options.max}`)
    // }

    if (this._options.metadata.oneOf) {
      schema = schema.refine((x) => this._options.metadata.oneOf!.includes(x), `Expected one of [${this._options.metadata.oneOf.join(', ')}]`)
    }

    return schema
  }
}

export type BooleanMeta = {
  default?: boolean
  optional?: boolean
}

export class RTValueTypeBoolean <
  Metadata extends Record<string, unknown> = {},
  CustomOptions extends object = {},
  Self extends RTValueTypeBoolean<Metadata, CustomOptions, Self, keyof Self> =
    RTValueTypeBoolean<Metadata, CustomOptions, any, any>,
  ForceReturn extends keyof Self = keyof Self
> extends RTValueTypeBase<
  boolean,
  BooleanMeta & Metadata,
  CustomOptions,
  Self,
  ForceReturn
> {
  protected _baseType = 'boolean' as const

  protected _type = 'boolean'

  constructor (
    repoTherapy: RepoTherapy,
    description: string,
    options: CustomOptions &
      Partial<Options<boolean, BooleanMeta & Metadata, CustomOptions, Self>>
        = {} as CustomOptions
  ) {
    super(repoTherapy, description, {
      ...options,
      metadata: {
        ...(options.metadata || {}),
        default: undefined,
        optional: false
      }
    })
  }

  protected _unstrict (value: unknown) {
    if (
      [true, 'TRUE', 'true', 'True', 't', 'T', 1].includes(value as true)
    ) { return true }
    if (
      [false, 'FALSE', 'false', 'False', 'f', 'F', 0].includes(value as false)
    ) { return false }
    return value as boolean
  }

  protected _init () { return z.boolean() }
}

type ArrrayItem<T> = ReturnType<RTValueTypeBase<T>['chainable']>

export type ArrayMeta<T = unknown> = {
  default?: T[]
  optional?: boolean
  minLength?: number
  maxLength?: number
  exactLength?: number
  unique?: boolean
}

export class RTValueTypeArray <
  T = unknown,
  Metadata extends Record<string, unknown> = {},
  CustomOptions extends object = {},
  Self extends RTValueTypeArray<T, Metadata, CustomOptions, Self, keyof Self> =
    RTValueTypeArray<T, Metadata, CustomOptions, any, any>,
  ForceReturn extends keyof Self = keyof Self
> extends RTValueTypeBase<
  T[],
  ArrayMeta<T> & Metadata,
  CustomOptions,
  Self,
  ForceReturn
> {
  protected _baseType = 'array' as const

  protected _type = 'array'

  static override valueDefinition = ['T extends any', 'T[]']

  public static isArray = true

  override get typeDefinitionStr () {
    return `Array<${this._item.typeDefinition()}>`
  }

  private _item: ArrrayItem<T>

  constructor (
    repoTherapy: RepoTherapy,
    description: string,
    item: ArrrayItem<T>,
    options: CustomOptions &
      Partial<Options<T[], ArrayMeta<T> & Metadata, CustomOptions, Self>>
        = {} as CustomOptions
  ) {
    super(repoTherapy, description, {
      ...options,
      metadata: {
        ...(options.metadata || {}),
        default: undefined,
        optional: false,
        minLength: undefined,
        maxLength: undefined,
        exactLength: undefined,
        unique: false
      },
      forceReturn: [
        'getItem',
        ...(options.forceReturn || [])
      ]
    })
    this._item = item
  }

  public getItem (): ArrrayItem<T> { return this._item }

  public override mock (useDefault = true) {
    if (useDefault) {
      const def = this._getDefault()
      if (def !== undefined) { return def }
    }
    if (this._options.metadata.optional) { return undefined }
    const v = this._item.mock(useDefault)
    return (v === undefined ? [] : [v]) as T[]
  }

  protected _unstrict (value: unknown) {
    if (typeof value === 'string') {
      if (value.startsWith('[')) { return JSON.parse(value) as T[] }
      return value.split(',').map(x => x.trim()) as T[]
    }
    return value as T[]
  }

  protected _minLength (minLength: number) {
    if (
      this._options.metadata.maxLength === undefined ||
      minLength < this._options.metadata.maxLength
    ) { return }
    throw new this.errorClass('server_conflicting_configuration', {
      message: `minLength (${minLength}) is greater than or equal maxLength (${
        this._options.metadata.maxLength
      })`
    })
  }

  protected _maxLength (maxLength: number) {
    if (
      this._options.metadata.minLength === undefined ||
      maxLength > this._options.metadata.minLength
    ) { return }
    throw new this.errorClass('server_conflicting_configuration', {
      message: `maxLength (${maxLength}) is less than or equal minLength (${
        this._options.metadata.minLength
      })`
    })
  }

  protected _exactLength () {
    if (
      this._options.metadata.minLength === undefined &&
      this._options.metadata.maxLength === undefined
    ) { return }
    throw new this.errorClass('server_conflicting_configuration', {
      message: 'minLength or maxLength configured'
    })
  }

  protected _init () {
    return z.transform<T[]>((originData) => {
      if (!Array.isArray(originData)) {
        throw new this.errorClass('invalid_type', {
          fields: [JSON.stringify(originData)]
        })
      }

      const { minLength, maxLength, exactLength, unique } =
        this._options.metadata
      const error: Error[] = []

      if (minLength !== undefined && originData.length < minLength) {
        error.push(new this.errorClass('too_small', {
          message: `Expected array with at least ${minLength} items`,
          fields: [JSON.stringify(originData)]
        }))
      }

      if (maxLength !== undefined && originData.length > maxLength) {
        error.push(new this.errorClass('too_big', {
          message: `Expected array with at most ${maxLength} items`,
          fields: [JSON.stringify(originData)]
        }))
      }

      if (exactLength !== undefined && originData.length !== exactLength) {
        error.push(new this.errorClass(
          originData.length < exactLength ? 'too_small' : 'too_big',
          {
            message: `Expected array with exactly ${exactLength} items`,
            fields: [JSON.stringify(originData)]
          }
        ))
      }

      const result: T[] = []
      originData.forEach((x, i) => {
        try {
          result.push(this._item(x) as T)
        } catch (e) {
          if (e instanceof RTDocumentedError) { e.pushPath(i.toString()) }
          error.push(e as Error)
        }
      })

      if (unique) {
        const seen = new Set<string>()
        result.forEach((x, i) => {
          const key = JSON.stringify(x)
          if (seen.has(key)) {
            error.push(new this.errorClass('invalid_type', {
              message: 'Expected unique items',
              fields: [key],
              path: [i.toString()]
            }))
          }
          seen.add(key)
        })
      }

      if (error.length > 0) {
        const multipleError = new this.errorClass('multiple')
        error.forEach(x => multipleError.push(x))
        throw multipleError
      }
      return result
    })
  }
}

export type ObjectMeta = {
  soft?: boolean
  optional?: boolean
  keyMap?: (value: string[]) => string[]
  keyRevert?: (value: string[]) => string[]
}

export class RTValueTypeObject <
  T extends object = object,
  Metadata extends Record<string, unknown> = {},
  CustomOptions extends object = {},
  Self extends RTValueTypeObject<T, Metadata, CustomOptions, Self, keyof Self> =
    RTValueTypeObject<T, Metadata, CustomOptions, any, any>,
  ForceReturn extends keyof Self = keyof Self
> extends RTValueTypeBase<T, ObjectMeta & Metadata, CustomOptions, Self, ForceReturn
> {
  protected _baseType = 'object' as const

  protected _type = 'object'

  static override valueDefinition = ['T extends object', 'T']

  override get typeDefinitionStr () {
    return '{\n  ' + Object.entries(this._items).map(([k, value]) => {
      const v = value as ReturnType<RTValueTypeBase<unknown>['chainable']>
      const metadata = v.metadata() as {
        optional?: boolean
        default?: unknown
      }
      return `${k}${
        metadata.optional ? '?' : ''
      }: ${v.typeDefinition().replace(/\n/g, '\n  ')}`
    }).join('\n  ') + '\n}'
  }

  private _items: ObjectDefinition<T>

  constructor (
    repoTherapy: RepoTherapy,
    description: string,
    items: ObjectDefinition<T>,
    options: CustomOptions &
      Partial<Options<T, ObjectMeta & Metadata, CustomOptions, Self>>
        = {} as CustomOptions
  ) {
    super(repoTherapy, description, {
      ...options,
      metadata: {
        ...(options.metadata || {}),
        soft: false,
        optional: false,
        keyMap: undefined,
        keyRevert: undefined
      },
      forceReturn: [
        'getItems',
        'existingKeys',
        ...(options.forceReturn || [])
      ]
    })
    this._items = items
  }

  public getItems (): ObjectDefinition<T> { return this._items }

  public existingKeys (data: object) {
    return (Object.keys(this._items) as (keyof T & string)[])
      .filter(key => (data as Record<string, unknown>)[key] !== undefined)
  }

  public override mock (useDefault: boolean) {
    const result: Record<string, unknown> = {}
    for (const [key, fn] of Object.entries(this._items || {})) {
      const v = (fn as ReturnType<RTValueTypeBase<unknown>['chainable']>)
        .mock(useDefault)
      if (v !== undefined) { result[key] = v }
    }
    return result as T
  }

  protected _unstrict (value: unknown) {
    if (typeof value === 'string') {
      return JSON.parse(value) as T
    }
    return value as T
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

  private _restructure (data: object, fn?: (value: string[]) => string[]) {
    if (!fn) { return data as T }
    const keyDedup: string[][] = []
    const mapped = this._recursiveLoopToValue(data)
    let r = {} as T
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

  protected _init() {
    return z.transform<T>((originData) => {
      if (typeof originData !== 'object' || Array.isArray(originData)) {
        throw new this.errorClass('invalid_type', {
          fields: [JSON.stringify(originData)]
        })
      }

      const actualData = this._restructure(
        originData,
        this._options.metadata.keyMap
      )

      const error: Error[] = []
      if (!this._options.metadata.soft) {
        const baseKey = Object.keys(this._items)
        const unrecognizedKey = Object.keys(actualData)
          .filter(y => !baseKey.includes(y))
        for (const k of unrecognizedKey) {
          error.push(new this.errorClass('unrecognized_keys', {
            fields: [k],
            path: [k],
          }))
        }
      }

      const result: Record<string, unknown> = {}
      for (const [key, fn] of Object.entries(this._items || {})) {
        try {
          const _fn = ((this._options.metadata.soft && (
            fn as unknown as { soft?: () => void }
          ).soft?.()) || fn) as ReturnType<RTValueTypeBase<string>['chainable']>
          const v = _fn(actualData[key as keyof T])
          if (v !== undefined) { result[key] = v }
        } catch (e) {
          if (e instanceof RTDocumentedError) { e.pushPath(key) }
          error.push(e as Error)
        }
      }

      if (error.length > 0) {
        const multipleError = new this.errorClass('multiple')
        error.forEach(x => multipleError.push(x))
        throw multipleError
      }
      return result as T
    })
  }
}

export type PatternMeta = {
  optional?: boolean
}

export class RTValueTypePattern <
  Metadata extends Record<string, unknown> = {},
  CustomOptions extends object = {},
  Self extends RTValueTypePattern<Metadata, CustomOptions, Self, keyof Self> =
    RTValueTypePattern<Metadata, CustomOptions, any, any>,
  ForceReturn extends keyof Self = keyof Self
> extends RTValueTypeBase<string, PatternMeta & Metadata, CustomOptions, Self, ForceReturn> {
  protected readonly _pattern: RegExp

  protected readonly _patternName: string

  protected _baseType = 'string' as const

  protected _unstrict = String

  protected override get _type () {
    return `string /* ${this._patternName} */`
  }

  constructor (
    repoTherapy: RepoTherapy,
    name: string,
    description: string,
    pattern: RegExp,
    options: CustomOptions &
      Partial<Options<string, PatternMeta & Metadata, CustomOptions, Self>>
        = {} as CustomOptions
  ) {
    super(repoTherapy, description, {
      ...options,
      metadata: {
        ...(options.metadata || {}),
        optional: false,
        pattern
      }
    })
    this._pattern = pattern
    this._patternName = name
  }

  protected override _init () {
    let schema = z.string().regex(this._pattern)
    return schema
  }

  public static define (regexp: Record<string, {
    description: string
    pattern: RegExp
  } | RegExp>) {
    return () => Object.fromEntries(
      Object.entries(regexp).map(([key, x]) => [
        key,
        x instanceof RegExp
          ? { description: `pattern for ${key}`, pattern: x }
          : x
      ])
    )
  }
}
