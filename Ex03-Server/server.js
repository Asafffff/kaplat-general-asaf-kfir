const express = require("express");
const app = express();
const bodyParser = require("body-parser");

const todoArray = [];
let todoCounter = 0;

const TODO_STATUS = {
  PENDING: "PENDING",
  LATE: "LATE",
  DONE: "DONE",
};

const TODO_SORT_BY = {
  ID: "ID",
  DUE_DATE: "DUE_DATE",
  TITLE: "TITLE",
};

app.use(
  bodyParser.json({
    type() {
      return true;
    },
  })
);

const isValidStatus = (status) => {
  return Object.keys(TODO_STATUS).includes(status);
};

const isValidSortBy = (sortBy) => {
  return Object.keys(TODO_SORT_BY).includes(sortBy);
};

const filteredStatuses = (status, todoList) => {
  let todosResult;

  switch (status) {
    case TODO_STATUS.PENDING:
      todosResult = todoList.filter(
        (item) => item.status === TODO_STATUS.PENDING
      );
      break;
    case TODO_STATUS.LATE:
      todosResult = todoList.filter((item) => item.status === TODO_STATUS.LATE);
      break;
    case TODO_STATUS.DONE:
      todosResult = todoList.filter((item) => item.status === TODO_STATUS.DONE);
      break;
    case "ALL":
      todosResult = todoList;
      break;
    default:
      throw new Error("Error: Unknown status");
  }

  return todosResult;
};

const sortByStatuses = (sortBy, todoList) => {
  switch (sortBy) {
    case TODO_SORT_BY.ID:
      todoList.sort((a, b) => a.id - b.id);
      break;
    case TODO_SORT_BY.DUE_DATE:
      todoList.sort((a, b) => a.dueDate - b.dueDate);
      break;
    case TODO_SORT_BY.TITLE:
      todoList.sort((a, b) => a.title.localeCompare(b.title));
      break;
    default:
      throw new Error("Error: Unknown sortBy");
  }

  return todoList;
};

app.get("/todo/health", (req, res) => {
  return res.status(200).send("OK");
});

app.post("/todo", (req, res) => {
  const { title, content, dueDate } = req.body;

  if ((title == null) | (content == null) || dueDate == null) {
    return res
      .status(400)
      .send({ errorMessage: "Error: missing required body parameters" });
  }

  // TODO: Verify dueDate is a valid date in the future
  if (new Date(dueDate) < new Date()) {
    return res.status(409).send({
      errorMessage: `Error: Can’t create new TODO that its due date is in the past`,
    });
  }

  if (todoArray.map((item) => item.title).includes(title)) {
    return res.status(409).send({
      errorMessage: `Error: TODO with the title ${title} already exists in the system`,
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

app.get("/todo/size", (req, res) => {
  const status = req.query.status;
  let todosResult;

  if (!isValidStatus(status) && status != "ALL") {
    return res.status(400).send({ errorMessage: "Error: Unknown status" });
  }

  todosResult = filteredStatuses(status, todoArray);

  return res.status(200).send({ result: todosResult.length });
});

app.get("/todo/content", (req, res) => {
  let { status, sortBy } = req.query;
  sortBy = sortBy || TODO_SORT_BY.ID;

  try {
    todosResult = filteredStatuses(status, todoArray);
    todosResult = sortByStatuses(sortBy, todosResult);
  } catch (e) {
    return res.status(400).send({ errorMessage: e.message });
  }

  return res.status(200).send({ result: todosResult });
});

app.put("/todo", (req, res) => {
  let { id, status } = req.query;
  id = Number(id);

  if (!isValidStatus(status)) {
    return res.status(400).send({ errorMessage: `Error: invalid status` });
  }

  const todoIdx = todoArray.map((item) => item.id).indexOf(id);

  if (todoIdx == -1) {
    return res
      .status(404)
      .send({ errorMessage: `Error: no such TODO with id ${id}` });
  }

  const oldStatus = todoArray[todoIdx].status;
  todoArray[todoIdx].status = status;

  return res.status(201).send({ result: oldStatus });
});

app.delete("/todo", (req, res) => {
  let { id } = req.query;
  id = Number(id);

  const todoIdx = todoArray.map((item) => item.id).indexOf(id);

  if (todoIdx == -1) {
    return res
      .status(404)
      .send({ errorMessage: `Error: no such TODO with id ${id}` });
  }

  todoArray.splice(todoIdx, 1);

  return res.status(200).send({ result: todoArray.length });
});

const server = app.listen(8496, () => {
  console.log("Server listening on port 8496...\n");
});
