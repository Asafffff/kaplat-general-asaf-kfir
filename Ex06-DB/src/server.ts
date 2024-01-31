const express = require('express');
const app = express();
const bodyParser = require('body-parser');
import { todoLogger, todoLoggerTransports } from './logger/todoLogger';
import { requestLogger } from './logger/requestLogger';
import {
  TODO_STATUS,
  TODO_SORT_BY,
  isValidSortBy,
  isValidStatus,
  isValidPersistenceMethod,
  PERSISTENCE_METHOD,
} from './utils';
import { DataSource } from 'typeorm';
import { Todos } from './entities/todos.entity';
import { Todos as TodosMongo } from './entities/todosMongo.entity';

export let requestNumber = 0;

const PostgresDataSource = new DataSource({
  type: 'postgres',
  host: 'postgres',
  port: 5432,
  username: 'postgres',
  password: 'docker',
  database: 'todos',
  synchronize: false,
  entities: [Todos],
});
const PostgreTodoRepository = PostgresDataSource.getRepository(Todos);

const MongoDataSource = new DataSource({
  type: 'mongodb',
  host: 'mongo',
  port: 27017,
  database: 'todos',
  synchronize: true,
  entities: [TodosMongo],
});
const MongoTodoRepository = MongoDataSource.getRepository(TodosMongo);

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
app.post('/todo', async (req, res) => {
  const { title, content, dueDate } = req.body;

  if (title == null || content == null || dueDate == null) {
    const errorMessage = 'missing required body parameters';
    todoLogger.error(errorMessage);
    return res.status(400).send({ errorMessage });
  }

  todoLogger.info(`Creating new TODO with Title [${title}]`);
  const todoCount = await PostgreTodoRepository.count();
  todoLogger.debug(
    `Currently there are ${todoCount} TODOs in the system. New TODO will be assigned with id ${todoCount + 1}`
  );

  if (new Date(dueDate) < new Date()) {
    const errorMessage = `Error: Can’t create new TODO that its due date is in the past`;
    todoLogger.error(errorMessage);
    return res.status(409).send({
      errorMessage,
    });
  }

  if ((await PostgreTodoRepository.find({ where: { title: title } })).length > 0) {
    const errorMessage = `Error: TODO with the title ${title} already exists in the system`;
    todoLogger.error(errorMessage);
    return res.status(409).send({
      errorMessage,
    });
  }

  const newTodo = new Todos();
  const newTodoMongo = new Todos();

  newTodo.rawid = todoCount + 1;
  newTodo.title = title;
  newTodo.content = content;
  newTodo.duedate = dueDate;
  newTodo.state = TODO_STATUS.PENDING;

  newTodoMongo.rawid = todoCount + 1;
  newTodoMongo.title = title;
  newTodoMongo.content = content;
  newTodoMongo.duedate = dueDate;
  newTodoMongo.state = TODO_STATUS.PENDING;

  await PostgreTodoRepository.save(newTodo);
  await MongoTodoRepository.save(newTodoMongo);

  return res.status(200).send({ result: await PostgreTodoRepository.count({}) });
});

app.get('/todo/size', async (req, res) => {
  const status = req.query.status;
  const persistenceMethod = req.query.persistenceMethod;

  if (!isValidPersistenceMethod(persistenceMethod)) {
    const errorMessage = `Error: Unknown persistence method`;
    todoLogger.error(errorMessage);
    return res.status(400).send({ errorMessage });
  }

  if (!isValidStatus(status) && status != 'ALL') {
    const errorMessage = `Error: Unknown status`;
    todoLogger.error(errorMessage);
    return res.status(400).send({ errorMessage });
  }

  const TodoRepository =
    req.query.persistenceMethod == PERSISTENCE_METHOD.POSTGRES ? PostgreTodoRepository : MongoTodoRepository;
  const query = {};
  if (isValidStatus(status)) {
    query['where'] = { state: status };
  }
  const todosResult = await TodoRepository.find(query);
  todoLogger.info(`Total TODOs count for state ${status} is ${todosResult.length}`);

  return res.status(200).send({ result: todosResult.length });
});

app.get('/todo/content', async (req, res) => {
  let todosResult;
  let { status, sortBy } = req.query;
  const persistenceMethod = req.query.persistenceMethod;
  sortBy = sortBy || TODO_SORT_BY.ID;
  sortBy = (sortBy as string).toLowerCase();

  if (!isValidPersistenceMethod(persistenceMethod)) {
    const errorMessage = `Error: Unknown persistence method`;
    todoLogger.error(errorMessage);
    return res.status(400).send({ errorMessage });
  }
  const TodoRepository =
    req.query.persistenceMethod == PERSISTENCE_METHOD.POSTGRES ? PostgreTodoRepository : MongoTodoRepository;

  todoLogger.info(`Extracting todos content. Filter: ${status} | Sorting by: ${sortBy}`);

  const query = {
    order: { [sortBy]: 'ASC' },
  };
  if (isValidStatus(status)) {
    query['where'] = { state: status };
  }

  try {
    todosResult = await TodoRepository.find(query);
  } catch (e) {
    todoLogger.error(e.message);
    return res.status(400).send({ errorMessage: e.message });
  }

  todoLogger.debug(
    `There are a total of ${await TodoRepository.count()} todos in the system. The Result holds ${
      todosResult.length
    } todos`
  );

  todosResult.forEach((todo) => {
    todo.id = todo.rawid;
    delete todo.rawid;
  });
  return res.status(200).send({ result: todosResult });
});

app.put('/todo', async (req, res) => {
  let { id, status } = req.query;
  id = Number(id);

  if (!isValidStatus(status)) {
    const errorMessage = `Error: Invalid status`;
    todoLogger.error(errorMessage);
    return res.status(400).send({ errorMessage });
  }

  todoLogger.info(`Update TODO id [${id}] state to ${status}`);
  let todo: Todos;
  let todoMongo: TodosMongo;
  todo = await PostgreTodoRepository.findOne({ where: { rawid: id } });
  todoMongo = await MongoTodoRepository.findOne({ where: { rawid: id } });

  if (!todo) {
    const errorMessage = `Error: no such TODO with id ${id}`;
    todoLogger.error(errorMessage);
    return res.status(404).send({ errorMessage });
  }

  const oldStatus = todo.state;
  await PostgreTodoRepository.update({ rawid: id }, { state: status });
  await MongoTodoRepository.update({ rawid: id }, { state: status });

  todoLogger.debug(`Todo id [${id}] state change: ${oldStatus} --> ${status}`);

  return res.status(200).send({ result: oldStatus });
});

app.delete('/todo', async (req, res) => {
  let { id } = req.query;
  id = Number(id);

  todoLogger.info(`Removing todo id [${id}]`);

  let todo: Todos;

  todo = await PostgreTodoRepository.findOne({ where: { rawid: id } });

  if (!todo) {
    const errorMessage = `Error: no such TODO with id ${id}`;
    todoLogger.error(errorMessage);
    return res.status(404).send({ errorMessage });
  }

  await PostgreTodoRepository.delete({ rawid: id });
  await MongoTodoRepository.delete({ rawid: id });

  const todoCount = await PostgreTodoRepository.count();
  todoLogger.debug(`After removing todo id [${id}] there are ${todoCount} TODOs in the system`);

  return res.status(200).send({ result: todoCount });
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
      const errorMessage = `Error: No such logger ${loggerName}`;
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
    const errorMessage = `Error: Invalid logger level '${loggerLevel}'`;
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
      const errorMessage = `Error: No such logger ${loggerName}`;
      todoLogger.error(errorMessage);
      return res.status(404).send('No such logger');
  }

  return res.status(200).send(loggerLevel.toLocaleUpperCase());
});

app.listen(9285, async () => {
  await PostgresDataSource.initialize();
  await MongoDataSource.initialize();
  todoLogger.info('Server listening on port 9285...');
});
