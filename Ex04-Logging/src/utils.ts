export const TODO_STATUS = {
  PENDING: 'PENDING',
  LATE: 'LATE',
  DONE: 'DONE',
};

export const TODO_SORT_BY = {
  ID: 'ID',
  DUE_DATE: 'DUE_DATE',
  TITLE: 'TITLE',
};

export const isValidStatus = (status) => {
  return Object.keys(TODO_STATUS).includes(status);
};

export const isValidSortBy = (sortBy) => {
  return Object.keys(TODO_SORT_BY).includes(sortBy);
};

export const filteredStatuses = (status, todoList) => {
  let todosResult;

  switch (status) {
    case TODO_STATUS.PENDING:
      todosResult = todoList.filter((item) => item.status === TODO_STATUS.PENDING);
      break;
    case TODO_STATUS.LATE:
      todosResult = todoList.filter((item) => item.status === TODO_STATUS.LATE);
      break;
    case TODO_STATUS.DONE:
      todosResult = todoList.filter((item) => item.status === TODO_STATUS.DONE);
      break;
    case 'ALL':
      todosResult = todoList;
      break;
    default:
      throw new Error('Error: Unknown status');
  }

  return todosResult;
};

export const sortByStatuses = (sortBy, todoList) => {
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
      throw new Error('Error: Unknown sortBy');
  }

  return todoList;
};
