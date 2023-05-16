const express = require('express');
const app = express();
const bodyParser = require('body-parser');
import { todoLogger, todoLoggerTransports } from './logger/todoLogger';
import { requestLogger } from './logger/requestLogger';
import { TODO_STATUS, TODO_SORT_BY, isValidSortBy, isValidStatus, sortByStatuses, filteredStatuses } from './utils';

export let requestNumber = 0;
const todoArray: any = [];
let todoCounter = 0;

app.use(
  bodyParser.json({
    type() {
      return true;
    },
  })
);

app.use((req, res, next) => {
  const datetimeNow = new Date();
  requestNumber++;
  requestLogger.info(`Incoming request | #${requestNumber} | resource: ${req.path} | HTTP Verb ${req.method}`, {
    requestNumber,
  });

  req.on('end', () => {
    const datetimeEnd = new Date();
    const durationMilliseconds = datetimeEnd.getTime() - datetimeNow.getTime();
    requestLogger.debug(``, { requestNumber, duration: durationMilliseconds });
  });

  next();
});

/**
 * Get health status
 */
app.get('/todo/health', (req, res) => {
  return res.status(200).send('OK');
});

/**
 * Create new TODO
 */
app.post('/todo', (req, res) => {
  const { title, content, dueDate } = req.body;

  if (title == null || content == null || dueDate == null) {
    const errorMessage = 'missing required body parameters';
    todoLogger.error(errorMessage);
    return res.status(400).send({ errorMessage });
  }

  todoLogger.info(`Creating new TODO with Title [${title}]`);
  todoLogger.debug(
    `Currently there are ${todoArray.length} TODOs in the system. New TODO will be assigned with id ${todoCounter + 1}`
  );

  if (new Date(dueDate) < new Date()) {
    const errorMessage = `Can’t create new TODO that its due date is in the past`;
    todoLogger.error(errorMessage);
    return res.status(409).send({
      errorMessage,
    });
  }

  if (todoArray.map((item) => item.title).includes(title)) {
    const errorMessage = `TODO with the title ${title} already exists in the system`;
    todoLogger.error(errorMessage);
    return res.status(409).send({
      errorMessage,
    });
  }

  todoArray.push({
    id: ++todoCounter,
    title,
    status: TODO_STATUS.PENDING,
    content,
    dueDate,
  });

  return res.status(201).send({ result: todoArray.length });
});

app.get('/todo/size', (req, res) => {
  const status = req.query.status;
  let todosResult;

  if (!isValidStatus(status) && status != 'ALL') {
    const errorMessage = `Unknown status`;
    todoLogger.error(errorMessage);
    return res.status(400).send({ errorMessage });
  }

  todosResult = filteredStatuses(status, todoArray);
  todoLogger.info(`Total TODOs count for state ${status} is ${todosResult.length}`);

  return res.status(200).send({ result: todosResult.length });
});

app.get('/todo/content', (req, res) => {
  let todosResult;
  let { status, sortBy } = req.query;
  sortBy = sortBy || TODO_SORT_BY.ID;

  todoLogger.info(`Extracting todos content. Filter: ${status} | Sorting by: ${sortBy}`);

  try {
    todosResult = filteredStatuses(status, todoArray);
    todosResult = sortByStatuses(sortBy, todosResult);
  } catch (e) {
    todoLogger.error(e.message);
    return res.status(400).send({ errorMessage: e.message });
  }

  todoLogger.debug(
    `There are a total of ${todoArray.length} todos in the system. The Result holds ${todosResult.length} todos`
  );

  return res.status(200).send({ result: todosResult });
});

app.put('/todo', (req, res) => {
  let { id, status } = req.query;
  id = Number(id);

  if (!isValidStatus(status)) {
    const errorMessage = `Invalid status`;
    todoLogger.error(errorMessage);
    return res.status(400).send({ errorMessage });
  }

  todoLogger.info(`Update TODO id [${id}] state to ${status}`);

  const todoIdx = todoArray.map((item) => item.id).indexOf(id);

  if (todoIdx == -1) {
    const errorMessage = `no such TODO with id ${id}`;
    todoLogger.error(errorMessage);
    return res.status(404).send({ errorMessage });
  }

  const oldStatus = todoArray[todoIdx].status;
  todoArray[todoIdx].status = status;

  todoLogger.debug(`Todo id [${id}] state change: ${oldStatus} --> ${status}`);

  return res.status(201).send({ result: oldStatus });
});

app.delete('/todo', (req, res) => {
  let { id } = req.query;
  id = Number(id);

  todoLogger.info(`Removing todo id [${id}]`);

  const todoIdx = todoArray.map((item) => item.id).indexOf(id);

  if (todoIdx == -1) {
    const errorMessage = `no such TODO with id ${id}`;
    todoLogger.error(errorMessage);
    return res.status(404).send({ errorMessage });
  }

  todoArray.splice(todoIdx, 1);

  todoLogger.debug(`After removing todo id [${id}] there are ${todoArray.length} TODOs in the system`);

  return res.status(200).send({ result: todoArray.length });
});

/**
 * Get Logger level
 */
app.get('/logs/level', (req, res) => {
  const loggerName: string = req.query['logger-name'];
  let currentLoggerLevel;
  switch (loggerName) {
    case 'request-logger':
      currentLoggerLevel = requestLogger.level;
      break;
    case 'todo-logger':
      currentLoggerLevel = todoLogger.level;
      break;
    default:
      const errorMessage = `No such logger ${loggerName}`;
      todoLogger.error(errorMessage);
      return res.status(404).send('No such logger');
  }

  return res.status(200).send(currentLoggerLevel.toLocaleUpperCase());
});

/**
 * Set Logger level
 */
app.put('/logs/level', (req, res) => {
  const loggerName: string = req.query['logger-name'];
  const loggerLevel: string = req.query['logger-level'];

  if (
    !loggerLevel ||
    (loggerLevel.toLowerCase() != 'debug' &&
      loggerLevel.toLowerCase() != 'info' &&
      loggerLevel.toLowerCase() != 'error')
  ) {
    const errorMessage = `Invalid logger level '${loggerLevel}'`;
    todoLogger.error(errorMessage);
    return res.status(400).send(errorMessage);
  }

  switch (loggerName) {
    case 'request-logger':
      requestLogger.transports.forEach((t) => (t.level = loggerLevel.toLowerCase()));
      break;
    case 'todo-logger':
      todoLogger.transports.forEach((t) => (t.level = loggerLevel.toLowerCase()));
      break;
    default:
      const errorMessage = `No such logger ${loggerName}`;
      todoLogger.error(errorMessage);
      return res.status(404).send('No such logger');
  }

  return res.status(200).send(loggerLevel.toLocaleUpperCase());
});

app.listen(9583, () => {
  todoLogger.info('Server listening on port 9583...');
});
