import { createLogger, format, transports } from 'winston';
import { addRequestNumber } from './features/addRequestNumber';

export const todoLoggerTransports = {
  // console: new transports.Console({ level: 'info' }),
  file: new transports.File({ filename: 'logs/todos.log', level: 'info' }),
};

export const todoLogger = createLogger({
  format: format.combine(
    addRequestNumber(),
    format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss.sss' }),
    format.printf((info) => {
      if (info.level === 'error') {
        info.message = `Error: ${info.message}`;
      }
      return `${info.timestamp} ${info.level.toUpperCase()}: ${info.message}${
        info.requestNumber ? ` | request #${info.requestNumber}` : ''
      }`;
    })
  ),
  transports: [todoLoggerTransports.file],
  level: 'info',
});
