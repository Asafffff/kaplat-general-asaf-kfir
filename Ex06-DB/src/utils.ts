export const TODO_STATUS = {
  PENDING: 'PENDING',
  LATE: 'LATE',
  DONE: 'DONE',
};

export const TODO_SORT_BY = {
  ID: 'rawid',
  DUE_DATE: 'dueDate',
  TITLE: 'title',
};

export const PERSISTENCE_METHOD = {
  POSTGRES: 'POSTGRES',
  MONGO: 'MONGO',
};

export const isValidStatus = (status) => {
  return Object.keys(TODO_STATUS).includes(status);
};

export const isValidSortBy = (sortBy) => {
  return Object.keys(TODO_SORT_BY).includes(sortBy);
};

export const isValidPersistenceMethod = (persistenceMethod) => {
  return Object.keys(PERSISTENCE_METHOD).includes(persistenceMethod);
};
