import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import RTLogger from './logger.js'
import RepoTherapy from './repo-therapy.js'
import type { EventCallbacks, EventCallbackMeta, FilePath } from './types.js'
import type Logger from './logger.js'
import _ from 'lodash'

// export type Options <
//   CustomOptions extends object = {}
// > = CustomOptions & {
//   eventCallbacks?: Partial<EventCallbacks<U>>
//   repoTherapy: RepoTherapy
// }

type FunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[Exclude<keyof T, 'on' | 'before'>];

type OnCallback <
  T extends unknown,
  Args extends unknown[] = []
> = (
  data: T extends (...args: any[]) => infer R ? R : never,
  ...args: Args
) => void


export type ClassDefinition <CustomOptions extends object = {}> = new (
  option: CustomOptions,
  ...args: any[]
) => any // RepoTherapyBase<unknown>

// export type Options <
//   CustomOptions extends object = {}
// > = CustomOptions & {
//   eventCallbacks?: Partial<{
//     [K in keyof Self]: Self[K] extends (...args: any[]) => any
//       ? (arg: ReturnType<Self[K]>) => void | Promise<void>
//       : never
//   }>
// }

// export type UtilOptions <
//   Self extends ClassDefinition<CustomOptions>,
//   CustomOptions extends object = {}
// > = Options<Self, CustomOptions> & { repoTherapy: RepoTherapy }

export abstract class RepoTherapyBase <
  CustomOptions extends object = {},
  Self extends RepoTherapyBase<CustomOptions, Self> =
    RepoTherapyBase<CustomOptions, any>
> {
  private readonly _processes: (() => unknown)[] = []

  private readonly _optionsDefinitions: CustomOptions
  protected get _options () { return this._optionsDefinitions }

  constructor (options: CustomOptions) {
    this._optionsDefinitions = options
  }

  protected _addProcess (fn: () => unknown) {
    this._processes.push(fn)
  }

  public async init () {
    for (const p of this._processes) { await p.bind(this)() }
  }

  public before<K extends FunctionPropertyNames<Self>>(
    event: K,
    callback: () => void
  ) {
    const fn = this[event as keyof this]
    if (typeof fn !== 'function') {
      throw new Error()
    }
    ;(this[event as keyof this] as (...args: any[]) => any) = (...args) => {
      callback()
      return fn.apply(this, args)
    }
  }

  public on<
    K extends FunctionPropertyNames<Self>
  >(event: K, callback: OnCallback<Self[K]>) {
    const fn = this[event as keyof this]
    if (typeof fn !== 'function') {
      throw new Error()
    }
    ;(this[event as keyof this] as (...args: any[]) => any) = (...args) => {
      const value = fn.apply(this, args)
      if (value != null && typeof value.then === "function") {
        return value.then((x: typeof value) => {
          callback(x)
          return x
        })
      }
      callback(value)
      return value
    }
  }
}

export abstract class RepoTherapyUtilBase <
  CustomOptions extends object = {},
  Self extends RepoTherapyBase<CustomOptions, Self> =
    RepoTherapyBase<CustomOptions, any>
> extends RepoTherapyBase<
  CustomOptions & { prefix?: (string | number)[] },
  Self
> {
  protected readonly _repoTherapy: RepoTherapy = this as unknown as RepoTherapy

  private _logger: RTLogger = {} as RTLogger
  protected get logger () { return this._logger }

  protected get errorClass () { return this._repoTherapy.errorClass }

  constructor(
    repoTherapy: RepoTherapy,
    options: CustomOptions & { prefix?: (string | number)[] }
  ) {
    super(options)
    this._repoTherapy = repoTherapy

    if (!(this instanceof RTLogger)) { this.resetLogger() }
  }

  public resetLogger () {
    this._logger = this._repoTherapy.logger
      .childContext(...(this._options.prefix || [_.kebabCase(this.constructor.name)]))
  }

  public override before<K extends FunctionPropertyNames<Self>>(
    event: K,
    callback: (logger: Logger) => void
  ) { super.before(event, () => callback(this.logger)) }

  public override on<
    K extends FunctionPropertyNames<Self>
  >(event: K, callback: OnCallback<Self[K], [Logger]>) {
    super.on(event, (data) => callback(data, this.logger))
  }

  // async init () {
  //   for (const x of this._processes) {
  //     await x.bind(this)()
  //   }
  // }

  // private _hookEvent<
  //   T extends keyof RepoTherapyDefinitions.EventCallbacksType<EventCallbacks>
  // > (
  //   key: T,
  //   v: RepoTherapyDefinitions.EventCallbacksType<EventCallbacks>[T]
  // ) {
  //   const instance = this as unknown as RepoTherapyDefinitions
  //     .InternalHookHandlers<EventCallbacks>
  //   const fn = instance[`_${key as string}`]
  //   if (typeof fn !== 'function') {
  //     // throw new ServerErrorInternalServerError('internal_error', {
  //     //   message: 'Unable to mount non-function event',
  //     //   // details: [{
  //     //   //   code: ServerErrorCode.unknown,
  //     //   //   issue: `_${key as string}`
  //     //   // }]
  //     // })
  //     return
  //   }
  //   (instance[`_${key as string}`] as any) = (...args: unknown[]) => {
  //     const result = fn.apply(this, args as any) as any
  //     const logger = this.logger.childContext(_.kebabCase(key.toString()))
  //     if (
  //       !!result &&
  //       (typeof result === 'object' || typeof result === 'function') &&
  //       typeof result.then === 'function'
  //     ) {
  //       result.then((x: any) => v(x, logger))
  //     } else { v(result, logger) }
  //     return result
  //   }
  // }

  // public on<T extends keyof EventCallbacks> (
  //   event: T,
  //   callback: RepoTherapyDefinitions.EventCallbacksType<EventCallbacks>[T]
  // ) { this._hookEvent(event, callback) }

  // protected _chainify <
  //   T extends object,
  //   U extends keyof T & string = keyof T & string
  // > (instance: T, callbackName: U): BaseDefinitions.Chainify<T, U> {
  //   const wrapperObj = Object.assign(
  //     (instance[callbackName] as (...args: any[]) => any).bind(instance), {}
  //   ) as BaseDefinitions.Chainify<T, U>

  //   let proto = instance
  //   do {
  //     Object.getOwnPropertyNames(proto).forEach(name => {
  //       const n = name as keyof typeof wrapperObj &
  //         keyof typeof instance &
  //         string
  //       if (
  //         n === 'constructor' ||
  //         n.startsWith('_') ||
  //         wrapperObj[n]
  //       ) { return }
  //       const fn = instance[n] as (...args: any[]) => any
  //       if (
  //         typeof fn !== 'function' ||
  //         n === callbackName
  //       ) { return }
  //       (
  //         wrapperObj[n] as (...args: any[]) => BaseDefinitions.ChainifyObject<T>
  //       ) = (...args: Parameters<typeof fn>) => {
  //         try {
  //           return fn.apply(instance, args) || wrapperObj
  //         } catch (e) {
  //           // if (e instanceof BaseError) { e.reanchorStack(wrapperObj[n]) }
  //           throw e
  //         }
  //       }
  //     })
  //     proto = Object.getPrototypeOf(proto)
  //   } while (proto && proto !== Object.prototype)

  //   return wrapperObj
  // }
}
