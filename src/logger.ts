import config from 'config'
import winston from 'winston'

const {
  combine, timestamp, printf,
  colorize, align
} = winston.format

export const logger = winston.createLogger({
  level: config.get('logger.level') ?? 'info',
  transports: [new winston.transports.Console()],
  format: combine(
    colorize({ all: true }),
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS'
    }),
    align(),
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`)
  )
})
