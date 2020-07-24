import * as _ from 'lodash-es';
import { createBrowserHistory, createMemoryHistory, History } from 'history';

type AppHistory = History & { pushPath: History['push'] };

let createHistory;

try {
  if (process.env.NODE_ENV === 'test') {
    // Running in node. Can't use browser history
    createHistory = createMemoryHistory;
  } else {
    createHistory = createBrowserHistory;
  }
} catch (unused) {
  createHistory = createBrowserHistory;
}

export const history: AppHistory = createHistory({ basename: window.SERVER_FLAGS.basePath });

const removeBasePath = (url = '/') =>
  _.startsWith(url, window.SERVER_FLAGS.basePath)
    ? url.slice(window.SERVER_FLAGS.basePath.length - 1)
    : url;

// Monkey patch history to slice off the base path
(history as any).__replace__ = history.replace;
history.replace = (url) => (history as any).__replace__(removeBasePath(url));

(history as any).__push__ = history.push;
history.push = (url) => (history as any).__push__(removeBasePath(url));
(history as any).pushPath = (path) => (history as any).__push__(path);

export const getQueryArgument = (arg: string) =>
  new URLSearchParams(window.location.search).get(arg);

export const setQueryArgument = (k: string, v: string) => {
  const params = new URLSearchParams(window.location.search);
  if (params.get(k) !== v) {
    params.set(k, v);
    const url = new URL(window.location.href);
    history.replace(`${url.pathname}?${params.toString()}${url.hash}`);
  }
};

export const setAllQueryArguments = (newParams: { [k: string]: string }) => {
  const params = new URLSearchParams();
  let update = false;
  _.each(newParams, (v, k) => {
    if (params.get(k) !== v) {
      update = true;
      params.set(k, v);
    }
  });
  if (update) {
    const url = new URL(window.location.href);
    history.replace(`${url.pathname}?${params.toString()}${url.hash}`);
  }
};

export const removeQueryArgument = (k: string) => {
  const params = new URLSearchParams(window.location.search);
  if (params.has(k)) {
    params.delete(k);
    const url = new URL(window.location.href);
    history.replace(`${url.pathname}?${params.toString()}${url.hash}`);
  }
};
