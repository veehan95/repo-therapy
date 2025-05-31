import winston from 'winston'

export const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.cli(),
    winston.format.colorize({ all: true })
  ),
  transports: [new winston.transports.Console()]
})
