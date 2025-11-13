import winston, { type transport as Transport } from 'winston'
import { defineRepoTherapyInternalWrapper as wrapper } from './wrapper'
import { ConsolePrefix } from '../enums'
import { type GenericType, type Util } from '../types/repo-therapy'

export function defineRepoTherapyLogger ({
  service = 'main',
  levels = ['error', 'warn', 'info', 'success', 'complete'],
  transportConfig = ['console'],
  transportFormat
}: {
  service?: string
  levels?: Array<keyof typeof ConsolePrefix>
  transportConfig?: Array<'file' | 'console' | import('winston').transport>
  transportFormat?: winston.Logform.Format
} = {}) {
  return wrapper('define-logger', ({ env }: { env: Util.BaseEnv }) => {
    const _transports: Array<Transport> = []

    let serviceName = service
    if (env) {
      if (env.project) { serviceName = `${env.project}.${serviceName}` }
      if (env.nodeEnv) { serviceName += `.${env.nodeEnv}` }
    }

    function printString (
      level: keyof typeof ConsolePrefix,
      message: GenericType | undefined | unknown
    ) {
      return `${(
        ConsolePrefix[level] || `\x1b[44m ${level} \x1b[49m<serviceName> |`
      ).replace(/<serviceName>/, serviceName)}${
        (typeof message === 'object' ? JSON.stringify(message) : message) || ''
      }`
    }

    const format = transportFormat || winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf((params) => {
        const level = (
          params[Symbol.for('level')]?.toString() || 'unknown'
        ) as keyof typeof ConsolePrefix
        return printString(level, params.message)
      })
    )

    if (transportConfig.includes('file')) {
      _transports.push(...levels.map(
        // winston.format.json()
        level => new winston.transports
          // todo path
          .File({ filename: `${serviceName}.${level}.log`, level, format })
      ))
    }
    if (transportConfig.includes('console')) {
      _transports.push(new winston.transports.Console({
        format,
        level: levels.at(-1)
      }))
    }
    transportConfig
      .filter(x => x && typeof x !== 'string')
      .forEach(x => { _transports.push(x) })

    const loggerObj = winston.createLogger({
      levels: Object.fromEntries(levels.map((x, i) => [x, Number(i)])),
      format: winston.format.json(),
      defaultMeta: { service: serviceName },
      transports: _transports
    })

    return {
      logger: Object.fromEntries(levels.map(x => [
        x,
        (str: string, ...meta: Array<string>) => (
          loggerObj as unknown as Record<string, winston.LeveledLogMethod>
        )[x](str, ...meta)
      ])) as Record<typeof levels[number], winston.LeveledLogMethod>,
      printString
    }
  })
}
