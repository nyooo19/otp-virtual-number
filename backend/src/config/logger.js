import pino from 'pino';
import pinoHttp from 'pino-http';
import dotenv from 'dotenv';

dotenv.config();

const logLevel = process.env.LOG_LEVEL || 'info';

const logger = pino(
  {
    level: logLevel,
    timestamp: pino.stdTimeFunctions.isoTime,
  }
);

export const httpLogger = pinoHttp({ logger });

export default logger;