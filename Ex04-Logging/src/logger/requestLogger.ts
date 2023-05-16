import { createLogger, format, transports } from 'winston';
import { addRequestNumber } from './features/addRequestNumber';

const loggerTransports = [
  new transports.Console({ level: 'info' }),
  new transports.File({ filename: 'logs/requests.log', level: 'info' }),
];

export const requestLogger = createLogger({
  format: format.combine(
    addRequestNumber(),
    format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss.sss' }),
    format.printf((info) => {
      if (info.duration) {
        return `request #${info.requestNumber} duration: ${info.duration}ms`;
      }
      return `${info.timestamp} ${info.level.toUpperCase()}: ${info.message}${
        info.requestNumber ? ` | request #${info.requestNumber}` : ''
      }`;
    })
  ),
  transports: loggerTransports,
  level: 'info',
});
