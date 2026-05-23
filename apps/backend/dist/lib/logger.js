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
class Logger {
    debug(message, meta) {
        if (meta) {
            pinoLogger.debug(meta, message);
        }
        else {
            pinoLogger.debug(message);
        }
    }
    info(message, meta) {
        if (meta) {
            pinoLogger.info(meta, message);
        }
        else {
            pinoLogger.info(message);
        }
    }
    warn(message, meta) {
        if (meta) {
            pinoLogger.warn(meta, message);
        }
        else {
            pinoLogger.warn(message);
        }
    }
    error(message, meta) {
        if (meta) {
            pinoLogger.error(meta, message);
        }
        else {
            pinoLogger.error(message);
        }
    }
}
export const logger = new Logger();
//# sourceMappingURL=logger.js.map