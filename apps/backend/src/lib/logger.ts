import pino from 'pino';

const isProd = process.env.NODE_ENV === 'production';

const pinoLogger = pino({
  level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
  transport: isProd
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
        },
      },
});

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  debug(message: string, meta?: any) {
    if (meta) {
      pinoLogger.debug(meta, message);
    } else {
      pinoLogger.debug(message);
    }
  }

  info(message: string, meta?: any) {
    if (meta) {
      pinoLogger.info(meta, message);
    } else {
      pinoLogger.info(message);
    }
  }

  warn(message: string, meta?: any) {
    if (meta) {
      pinoLogger.warn(meta, message);
    } else {
      pinoLogger.warn(message);
    }
  }

  error(message: string, meta?: any) {
    if (meta) {
      pinoLogger.error(meta, message);
    } else {
      pinoLogger.error(message);
    }
  }
}

export const logger = new Logger();
