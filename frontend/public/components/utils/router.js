import { createBrowserHistory, createMemoryHistory } from 'history';

let createHistory;

try {
  // eslint-disable-next-line no-undef
  if (process.env.NODE_ENV === 'test') {
    // Running in node. Can't use browser history
    createHistory = createMemoryHistory;
  } else {
    createHistory = createBrowserHistory;
  }
} catch (unused) {
  createHistory = createBrowserHistory;
}

export const history = createHistory({basename: window.SERVER_FLAGS.basePath});

export const getQueryArgument = arg => new URL(window.location).searchParams.get(arg);
