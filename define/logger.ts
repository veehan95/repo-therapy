import winston, {
  type transport as Transport,
  type LeveledLogMethod
} from 'winston'
import { defineRepoTherapyWrapper as wrapper } from './wrapper'

const consolePrefix = {
  error: '\x1b[41m ERROR \x1b[49m',
  warn: '\x1b[43m\x1b[30m WARN \x1b[39m\x1b[49m',
  info: '\x1b[36m\u2139\x1b[39m',
  success: '\x1b[32m\u2714\x1b[39m',
  complete: '✨ '
}

function printString (
  level: keyof typeof consolePrefix | string,
  message: string
) {
  return `${
    consolePrefix[level as keyof typeof consolePrefix] ||
    `\x1b[44m ${level} \x1b[49m`
  } ${message}`
}

const f: typeof defineRepoTherapyLogger = ({
  service = 'project-init',
  transportConfig
} = {}) => wrapper('define-logger', ({ env }) => {
  const _transports: Array<Transport> = []
  if (transportConfig) {
    if (transportConfig.includes('file')) {
      _transports.push(
        // todo , 'verbose', 'debug'
        ...Object.keys(consolePrefix).map(x => new winston.transports.File({
          filename: `${x}.log`,
          level: x
        }))
      )
      _transports.push(new winston.transports.File({
        filename: 'combined.log'
      }))
    }
    transportConfig.filter(x => x && typeof x !== 'string')
      .forEach(x => { _transports.push(x as Transport) })
  }
  if (!transportConfig || transportConfig?.includes('console')) {
    _transports.push(
      new winston.transports.Console({
        level: 'complete',
        format: winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.printf((params) => printString(
            params[Symbol.for('level')]?.toString() || 'unknown',
            params.message?.toString() || 'unknown'
          ))
        )
      })
    )
  }
  const logger = winston.createLogger({
    levels: Object.fromEntries(
      Object.keys(consolePrefix).map((x, i) => [x, i])
    ),
    format: winston.format.json(),
    defaultMeta: { service: `${service || env.project}.${env.nodeEnv}` },
    transports: _transports
  })

  return {
    logger: {
      complete: (...s) => (logger as unknown as { complete: LeveledLogMethod })
        .complete(...s),
      error: (...s) => logger.error(...s),
      info: (...s) => logger.info(...s),
      success: (...s) => (logger as unknown as { success: LeveledLogMethod })
        .success(...s),
      warn: (...s) => logger.warn(...s)
    },
    printString
  }
})

export { f as defineRepoTherapyLogger }
