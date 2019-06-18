import * as _ from 'lodash';
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

const removeBasePath = (url = '/') => _.startsWith(url, window.SERVER_FLAGS.basePath)
  ? url.slice(window.SERVER_FLAGS.basePath.length - 1)
  : url;

// Monkey patch history to slice off the base path
history.__replace__ = history.replace;
history.replace = url => history.__replace__(removeBasePath(url));

history.__push__ = history.push;
history.push = url => history.__push__(removeBasePath(url));
history.pushPath = path => history.__push__(path);

export const getQueryArgument = (arg: string) => new URLSearchParams(window.location.search).get(arg);

export const setQueryArgument = (k: string, v: string) => {
  const params = new URLSearchParams(window.location.search);
  params.set(k, v);
  const url = new URL(window.location.href);
  history.replace(`${url.pathname}?${params.toString()}${url.hash}`);
};

export const removeQueryArgument = (k: string) => {
  const params = new URLSearchParams(window.location.search);
  params.delete(k);
  const url = new URL(window.location.href);
  history.replace(`${url.pathname}?${params.toString()}${url.hash}`);
};
