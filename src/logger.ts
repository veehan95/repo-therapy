import * as readline from 'node:readline/promises'
import { stdin, stdout } from 'node:process'

import type { RepoTherapy } from 'repo-therapy'
import { RepoTherapyUtilBase } from './base.js'

export type Options = {
  debug?: boolean
  delimiter?: string
  prefix: (string | number)[]
  maxSizePerLog?: number
  sliceStrategy?: 'chunk' | 'message'
  isFirstInit?: boolean
}

export default class RTLogger <
  CustomOptions extends object = {},
  Self extends RTLogger<CustomOptions, Self> = RTLogger<CustomOptions, any>
> extends RepoTherapyUtilBase <
  CustomOptions & Options,
  RTLogger<CustomOptions, any>
> {
  get prefixStr () { return this._options.prefix || [] }

  protected get _delimiterStr () {
    return ` ${this._options.delimiter || '|'} `
  }

  protected get _loggerFn (): {
    trace: (...s: Array<unknown>) => void
    debug: (...s: Array<unknown>) => void
    info: (...s: Array<unknown>) => void
    warn: (...s: Array<unknown>) => void
    error: (...s: Array<unknown>) => void
  } {
    return {
      /* eslint-disable no-console */
      trace: (...s: Array<unknown>) => {
        console.log(['trace', s.join('')].join(this._delimiterStr))
      },
      debug: (...s: Array<unknown>) => {
        console.log(['debug', s.join('')].join(this._delimiterStr))
      },
      info: (...s: Array<unknown>) => {
        console.log(['info ', s.join('')].join(this._delimiterStr))
      },
      warn: (...s: Array<unknown>) => {
        console.log(['warn ', s.join('')].join(this._delimiterStr))
      },
      error: (...s: Array<unknown>) => {
        console.log(['error', s.join('')].join(this._delimiterStr))
      },
      /* eslint-enable no-console */
    }
  }

  protected get _l (): {
    trace: (...s: Array<unknown>) => void
    debug: (...s: Array<unknown>) => void
    info: (...s: Array<unknown>) => void
    warn: (...s: Array<unknown>) => void
    error: (...s: Array<unknown>) => void
  } {
    if (this._repoTherapy.environment !== 'local') {
      return this._loggerFn
    }
    return {
      /* eslint-disable no-console */
      trace: (...s: Array<unknown>) => {
        console.log(['trace ', s.join('')].join(this._delimiterStr))
      },
      debug: (...s: Array<unknown>) => {
        console.log(['debug ', s.join('')].join(this._delimiterStr))
      },
      info: (...s: Array<unknown>) => {
        console.log(['info  ', s.join('')].join(this._delimiterStr))
      },
      warn: (...s: Array<unknown>) => {
        console.log(['warn  ', s.join('')].join(this._delimiterStr))
      },
      error: (...s: Array<unknown>) => {
        console.log(['error ', s.join('')].join(this._delimiterStr))
      },
      /* eslint-enable no-console */
    }
  }

  constructor (
    repoTherapy: RepoTherapy,
    options: CustomOptions & Partial<Options>
  ) {
    super(
      repoTherapy,
      { ...options, prefix: options.prefix || [] }
    )
  }

  protected _getMessage(...msg: Array<string | number | object>) {
    return msg.flatMap((x) => {
      if (x instanceof Error) {
        const str: string[] = []
        const documentedError = x as Error & {
          code: string
          fullStatusCode: number
        }
        if (documentedError.code) { str.push(`code: ${documentedError.code}`) }
        if (documentedError.fullStatusCode) {
          str.push(`status code: ${documentedError.fullStatusCode}`)
        }
        str.push(x.message)
        const details = (x as unknown as { details: unknown }).details
        if (details) {
          str.push(`details: ${
            typeof details === 'string' ? details : JSON.stringify(details)
          }`)
        }
        str.push(`stack: ${
          typeof x.stack === 'string' ? x.stack : JSON.stringify(x.stack)
        }`)
        return str
      }
      return [typeof x === 'object' ? JSON.stringify(x) : x]
    }).join(this._delimiterStr)
  }

  private _fullMessage (...msg: Array<string | number | object>) {
    const msgStr = this._getMessage(...msg)
    const prefixStr = this.prefixStr
      .reduce((acc, cur) => `${acc}${cur}${this._delimiterStr}`, '')
      .toString()
    return prefixStr + msgStr
  }

  private _print(
    logger: (...arg: Array<string>) => void,
    ...msg: Array<string | number | object>
  ) {
    const msgStr = this._fullMessage(...msg)
    if (!this._options.maxSizePerLog) {
      logger(msgStr)
      return
    }

    if (this._options.sliceStrategy === 'message') {
      let fullStr = msgStr
      const maxSizePerLog = this._options.maxSizePerLog - msgStr.length
      do {
        logger(msgStr.slice(0, maxSizePerLog))
        fullStr = fullStr.slice(maxSizePerLog)
      } while (fullStr.length > 0)
      return
    }

    let fullStr = msgStr
    const arr: string[] = []
    do {
      arr.push(fullStr.slice(0, this._options.maxSizePerLog))
      fullStr = fullStr.slice(this._options.maxSizePerLog)
    } while (fullStr.length > 0)
    logger(...arr)
  }

  public trace (...msg: Array<string | number | object>) {
    this._print(this._l.trace, ...msg)
  }

  public debug (callback: () => Array<string | number | object>) {
    if (!this._options.debug) { return }
    this._print(this._l.debug, ...callback())
  }

  public info (...msg: Array<string | number | object>) {
    this._print(this._l.info, ...msg)
  }

  public warn (...msg: Array<string | number | object>) {
    this._print(this._l.warn, ...msg)
  }

  public error (err: Error, ...msg: Array<string | number | object>) {
    this._print(this._l.error, err, ...msg)
  }

  public prompt () {
    const rl = readline.createInterface(stdin, stdout)
    return {
      push: (...msg: Array<string | number | object>) => rl.question(
        'prompt' + this._delimiterStr + this._fullMessage(...msg)
      ),
      close: () => { rl.close() }
    }
  }

  public childContext (...logPrefix: (string | number)[]): RTLogger {
    const instace = this
    const Base = this.constructor as new (
      repoTherapy: RepoTherapy,
      options: CustomOptions & Options
    ) => RTLogger
    return new class extends Base {
      override get prefixStr () { return [...instace.prefixStr, ...logPrefix] }
    }(this._repoTherapy, {
      ...this._options,
      logPrefix,
      isFirstInit: false
    })
  }

  public static async loader (repoTherapy: RepoTherapy): Promise<RTLogger> {
    const path = '/config/logger.ts'
    const l = await repoTherapy.importScript<{
      default: typeof RTLogger
    }>(['logger'], path)
    const prefix = [repoTherapy.app]
    const logger = new (l?.import.default || RTLogger)(repoTherapy, {
      debug: repoTherapy.options.debug,
      isFirstInit: true,
      prefix
    })

    logger.debug(() => ['logger', 'searching file', path])
    if (l) {
      logger.debug(() => ['logger', 'found', l.path])
    } else {
      logger.debug(() => [
        'logger',
        'no logger config file, using default instead'
      ])
    }

    return logger
  }
}
