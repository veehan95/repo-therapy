import { ZodError, type ZodType } from 'zod'
import { RepoTherapyUtilBase } from './base.js'
import type RepoTherapy from './repo-therapy.js'
import RTDocumentedError from './error.js'
import type { ErrorCode } from '../generated/types/errors.js'
import _ from 'lodash'
import type { ValueTypeDefinition } from '../generated/types/value-types.js'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { RTValueTypePattern } from './value-type-definitions.js'

export type BaseMeta = {
  nullable: boolean
  strict: boolean
}

type RTValueTypeClass <T = unknown> = new (
  ...args: ConstructorParameters<typeof RTValueTypeBase<T>>
) => RTValueTypeBase<T>

type ChainableProps <
  Metadata extends Record<string, unknown> = {},
  Self extends RTValueTypeBase<unknown, any, any, any>
    = RTValueTypeBase<unknown, any, any, any>,
  ForceReturn extends keyof Self = keyof Self
> =  {
  [
    K in keyof Required<Metadata & BaseMeta>
  ]: K extends 'default'
    ? (x: (Metadata & BaseMeta)[K]) => Chainable<Metadata, Self>
    : Required<(Metadata & BaseMeta)>[K] extends boolean
      ? () => Chainable<Metadata, Self>
      : (x: (Metadata & BaseMeta)[K]) => Chainable<Metadata, Self>
} & {
  [K in Exclude<{
    [K in keyof Self]: K extends `_${string}` ? never : K
  }[keyof Self], 'parse' | 'chainable' | 'init' | 'typeDefinitionStr' | 'mock' | 'extend'>]:
    Self[K] extends infer A extends (...args: any[]) => unknown | unknown[]
      ? (...args: Parameters<A>) => K extends ForceReturn
        ? ReturnType<A>
        : Chainable<Metadata, Self>
      : never
}

type Chainable <
  Metadata extends Record<string, unknown> = {},
  Self extends RTValueTypeBase<unknown, any, any, any>
    = RTValueTypeBase<unknown, any, any, any>,
  ForceReturn extends keyof Self = keyof Self
> = ((v: unknown) => ReturnType<Self['parse']>) &
  ChainableProps<Metadata, Self, ForceReturn> &
  {
    typeDefinition: () => string
    metadata: () => Metadata & {
      baseType: string
      description: string
    }
    mock: (useDefault?: boolean) => ReturnType<Self['mock']>
    extend: <NewMeta extends Record<string, unknown>> (
      metadata: NewMeta
    ) => Chainable<Metadata & NewMeta, Self, ForceReturn>
  }

export type Options <
  T extends unknown,
  Metadata extends Record<string, unknown> = {},
  CustomOptions extends object = {},
  Self extends RTValueTypeBase<T, Metadata, CustomOptions, Self, keyof Self>
    = RTValueTypeBase<T, Metadata, CustomOptions, any, any>,
> = {
  metadata: Metadata
  forceReturn?: (keyof Self & string)[]
}

type BaseType =
  | 'string' | 'number' | 'boolean' | 'object' | 'array'
type PrimitiveType<T extends string> = T extends BaseType ? T
  : T extends `${infer Inner}[]`
    ? PrimitiveType<Inner> extends never ? never : T
    : never;

export default abstract class RTValueTypeBase <
  T extends unknown,
  Metadata extends Record<string, unknown> = {},
  CustomOptions extends object = {},
  Self extends RTValueTypeBase<T, Metadata, CustomOptions, Self, keyof Self>
    = RTValueTypeBase<T, Metadata, CustomOptions, any, any>,
  ForceReturn extends keyof Self = keyof Self
> extends RepoTherapyUtilBase<Options<
  T,
  Metadata,
  CustomOptions,
  Self
> & CustomOptions, Self> {
  protected abstract _baseType: PrimitiveType<BaseType>

  protected abstract _type: string
  get typeDefinitionStr () {
    const oneOf = (this._options.metadata as { oneOf?: T[] })?.oneOf
    if (oneOf) {
      return oneOf.map(x => typeof x === 'string' ? `'${x}'` : x?.toString())
        .join(' | ')
    }
    return this._type
  }

  public static valueDefinition: string[] = []

  protected readonly _description: string

  protected _schema: ZodType<
    T | undefined
  > = undefined as unknown as ZodType<T | undefined>

  protected abstract _init (): ZodType<T>

  protected abstract _unstrict (value: unknown): T

  constructor (
    repoTherapy: RepoTherapy,
    description: string,
    options: Partial<
      CustomOptions &
      Options<T, Metadata, CustomOptions, Self>
    > = {} as CustomOptions
  ) {
    super(repoTherapy, {
      ...options,
      metadata: {
        ...(options.metadata || {}),
        description
      },
    } as Options<
      T,
      Metadata,
      CustomOptions,
      Self
    > & CustomOptions)
    this._description = description

    if (!this._options.metadata) { return }
    const fnOverride = Object
      .keys(this._options.metadata) as (keyof this & string)[]

    for (const k of fnOverride) { this._bindMetaSetter(k) }
  }
  
  protected _preParse (value: unknown) { return value }

  protected _postParse (value: T) { return value }

  private _bindMetaSetter <K extends keyof this & string> (k: K) {
    const instance = this
    const initValue = this._options.metadata[k as unknown as keyof Metadata]
    type Args = this[K] extends (...args: infer X) => unknown ? X : never;
    this[k] = ((...args: Args) => {
      if (instance._schema) {
        throw new instance.errorClass('server_configuration_locked', {
          fields: [k, JSON.stringify(args)]
        }, this[k] as Function)
      }

      if (
        this._options.metadata![k as keyof Metadata] !== undefined &&
        this._options.metadata![k as keyof Metadata] !== false
      ) {
        throw new instance.errorClass('server_configured_configuration', {
          fields: [k, JSON.stringify(args)]
        }, this[k] as Function)
      }

      const fn = this[
        `_${k}` as keyof this
      ] as ((...args: unknown[]) => void) | undefined
      try {
        const x = fn?.apply(this, args)
        ;(
          this._options.metadata![k as keyof Metadata] as unknown
        ) = typeof initValue === 'boolean'
          ? !initValue
          : (x as typeof this._options.metadata[typeof k] || args[0])
      } catch (e) {
        if (e instanceof RTDocumentedError) {
          e.reanchorStack(this[k] as Function)
        }
        throw e
      }
    }) as typeof instance[K]
  }

  public _lock () { if (!this._schema) { this._schema = this._init() } }

  public extend <NewMeta extends Record<string, unknown>> (
    metadata: NewMeta
  ): this {
    if (this._schema) {
      throw new this.errorClass('server_configuration_locked', {
        fields: ['extend', JSON.stringify(metadata)]
      }, this.extend)
    }

    const clone = Object.assign(
      Object.create(Object.getPrototypeOf(this)) as this,
      this
    )
    ;(clone as unknown as { _optionsDefinitions: unknown })._optionsDefinitions = {
      ...this._options,
      metadata: { ...this._options.metadata, ...metadata }
    }
    ;(clone as unknown as { _schema: unknown })._schema = undefined
    clone.resetLogger()

    const keys = Object.keys(clone._options.metadata) as (keyof this & string)[]
    for (const k of keys) { clone._bindMetaSetter(k) }

    return clone
  }

  protected _getDefault () {
    return (this._options.metadata as unknown as { default: T }).default
  }

  public mock (useDefault = true): T | undefined {
    if (useDefault) {
      const def = this._getDefault()
      if (def !== undefined) { return def }
    }
    if (
      (this._options.metadata as unknown as { optional?: boolean }).optional
    ) { return undefined }
    return `<${this._description}>` as unknown as T
  }

  public parse (value: unknown): T {
    this._lock()
    if (!this._schema) {
      throw new this.errorClass('server_not_init', {}, this.parse)
    }

    let _value = (
      value === undefined || value === ''
    ) ? this._getDefault() : value
    if (typeof _value === 'string') { _value = _value.trim() }
    if (_value === undefined) {
      if (
        (this._options.metadata as unknown as { optional?: boolean }).optional
      ) { return _value }
      throw new this.errorClass('mandatory_parameter', {}, this.parse)
    }

    if (_value === null) {
      if (this._options.metadata['nullable']) { return _value as T }
      throw new this.errorClass('non_nullable', {}, this.parse)
    }

    try {
      return this._postParse(
        this._schema.parse(
          this._preParse((
            this._options.metadata['strict'] ? _value : this._unstrict(_value)
          ) as T)
        ) as T
      )
    } catch (e) {
      if (e instanceof ZodError) {
        const err = new this.errorClass('multiple', {}, this.parse)
        e.issues.forEach((x) => {
          const { params = {} } = (x as {
            params?: {
              code?: ErrorCode
              expected?: string
            }
          })
          const fields = [
            typeof value === 'boolean' ? value?.toString(): value as string
          ]
          if (params?.expected) {
            fields.push(params.expected)
          } else if ((x as { expected?: string }).expected) {
            fields.push((x as { expected: string }).expected)
          }
          err.push(new this.errorClass(params.code || x.code, {
            message: x.message,
            path: x.path.map(x => x.toString()),
            fields
          }))
        })
        throw err
      }
      if (e instanceof RTDocumentedError) { throw e }
      throw new this.errorClass('unknown', e as Error)
    }
  }

  public chainable (): Chainable<
    Metadata,
    Self,
    ForceReturn
  > {
    const instance = this
    const wrapper = Object.assign((value: unknown) => {
      instance._lock.apply(this)
      try {
        return instance.parse.apply(this, [value])
      } catch (e) {
        const err = e instanceof RTDocumentedError
          ? e
          : new this.errorClass('unknown', e as Error)
        err.reanchorStack(wrapper)
        throw err
      }
    }, Object.fromEntries(
      Object.keys(this._options.metadata || {})
        .map(x => [x, (...args: unknown[]) => {
          (this[x as keyof this] as Function)(...args)
          return wrapper
        }])
    ), {
      typeDefinition: () => this.typeDefinitionStr,
      metadata: () => ({
        ...this._options.metadata,
        description: this._description,
        baseType: this._baseType
      }),
      mock: (useDefault?: boolean) => instance.mock(useDefault),
      extend: (metadata: Record<string, unknown>) => instance
        .extend(metadata)
        .chainable()
    }) as unknown as Chainable<
      Metadata,
      Self,
      ForceReturn
    >

    const stopAt = Object.getPrototypeOf(RTValueTypeBase.prototype)
    let proto = Object.getPrototypeOf(this)
    while (proto && proto !== stopAt) {
      for (const name of Object.getOwnPropertyNames(proto)) {
        if (
          ['constructor', 'parse', 'chainable', 'extend'].includes(name) ||
          /^_/.test(name) ||
          wrapper[name as keyof typeof wrapper]
        ) { continue }
        (wrapper[name as keyof typeof wrapper]) = ((...args: unknown[]) => {
          const x = (
            instance[name as keyof typeof instance] as Function
          )(...args)
          return (this._options.forceReturn || []).includes(name as Required<
            Options<T, Metadata, CustomOptions, Self>
          >['forceReturn'][number])
            ? x
            : wrapper
        }) as typeof wrapper[keyof typeof wrapper]
      }
      proto = Object.getPrototypeOf(proto)
    }

    return wrapper
  }
}

export class RTValueType {
  public static async loader (
    repoTherapy: RepoTherapy
  ): Promise<ValueTypeDefinition> {
    const r = (
      await repoTherapy.importScriptDir<{
        default: RTValueTypeClass
      }>(['value-type'], '/config/value-types')
    ).map(([key, x]) => {
      const k = key
      const importName = `V${_.camelCase('alueType_' + k)}`
      return {
        import: x.import.default,
        importPath: x.path.replace(/\.ts$/, '.js'),
        fn: k,
        importName,
        valueDefinition: (
          x.import.default as unknown as { valueDefinition: string[] }
        ).valueDefinition
      }
    })

    const baseValueTypeImport = await import('./value-type-definitions.js')
    const baseTypes = [{
      fn: 'string',
      importName: 'RTValueTypeString',
      import: baseValueTypeImport.RTValueTypeString
    }, {
      fn: 'number',
      importName: 'RTValueTypeNumber',
      import: baseValueTypeImport.RTValueTypeNumber
    }, {
      fn: 'boolean',
      importName: 'RTValueTypeBoolean',
      import: baseValueTypeImport.RTValueTypeBoolean
    }, {
      fn: 'object',
      importName: 'RTValueTypeObject',
      import: baseValueTypeImport.RTValueTypeObject
    }, {
      fn: 'array',
      importName: 'RTValueTypeArray',
      import: baseValueTypeImport.RTValueTypeArray
    }, {
      fn: 'pattern',
      importName: 'RTValueTypePattern',
      import: baseValueTypeImport.RTValueTypePattern
    }].filter(x => r.findIndex(y => y.fn === x.fn) < 0)

    const valueType: Record<
      string,
      (...args: unknown[]) => ReturnType<RTValueTypeBase<unknown>['chainable']>
    > = {}
    let importsStr = baseTypes.length > 0
      ? `import {\n  ${
        baseTypes.map(x => x.importName).join(',\n  ')
      }\n} from '${resolve(
        dirname(fileURLToPath(import.meta.url)),
        './value-type-definitions.js'
      )}'\n`
      : ''
    let objStr: string[] = []
    let patternDefinition = 'type PatternChain <ExtendedMetadata extends {} ' +
      '= {}> = '
    ;([...baseTypes, ...r] as {
      import: RTValueTypeClass
      importPath?: string
      fn: string
      valueDefinition?: [string, string]
      importName: string
    }[]).forEach((x) => {
      if (
        x.importPath
      ) { importsStr += `import ${x.importName} from '${x.importPath}'\n` }
      let fn = ''
      if (x.valueDefinition?.[0]) { fn += `<${x.valueDefinition[0]}> ` }
      fn += `(\n    ...args: ParamExtract<ConstructorParameters<typeof ${
        x.importName
      }>>\n  ) => ReturnType<${x.importName}<`
      if (x.valueDefinition?.[1]) { fn += `${x.valueDefinition[1]}, ` }
      fn += `ExtendedMetadata>['chainable']>`
      if (x.fn === 'pattern') {
        patternDefinition += fn
        objStr.push(`  ${x.fn}: PatternChain<ExtendedMetadata>`)
      } else { objStr.push(`  ${x.fn}: ${fn}`) }

      valueType[x.fn] = ((...args: unknown[]) => new x.import(
        ...[
          repoTherapy,
          ...args
        ] as unknown as ConstructorParameters<typeof x.import>
      ).chainable())
    })

    const patternList = await repoTherapy
      .importScript<{
        default: ReturnType<typeof RTValueTypePattern['define']>
      }>(['value-type-regexp'], '/config/regexp.ts')
      .then(x => x?.import.default() || {})

    const baseValueTypeKeys = Object.keys(valueType)
    Object.entries(patternList).forEach(([key, r]) => {
      if (baseValueTypeKeys.includes(key)) {
        throw new repoTherapy.errorClass('server_conflicting_configuration', {
          message: 'Pattern key conflicting with value type key',
          fields: [key]
        })
      }
      objStr.push(
        `  ${key}: (\n    ...args: ParamExtract<Parameters<PatternChain<` +
        'ExtendedMetadata>>>\n  ) => ReturnType<PatternChain<ExtendedMetadata>>'
      )
      valueType[key] = (
        ...arg: unknown[]
      ) => valueType['pattern']!(key, arg[0] || r.description, r.pattern)
    })

    repoTherapy.generateFile(
      '/types/value-types.ts',
      `${importsStr}\nexport type ParamExtract <Params extends unknown[]> =` +
      '\n  Params extends [unknown, ...infer Rest extends unknown[], unknown' +
      `?]\n   ? Rest extends unknown[] ? Rest : never\n  : never\n\nexport ${
        patternDefinition
          .split(/\n/)
          .map(x => x.replace(/^\s{2}/, ''))
          .join('\n')
      }\n\nexport ` +
      `type ValueTypeDefinition <ExtendedMetadata extends {} = {}> = {\n${
        objStr.join('\n')
      }\n}`
    )

    return valueType as ValueTypeDefinition
  }
}
