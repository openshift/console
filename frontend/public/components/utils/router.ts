import * as _ from 'lodash-es';
import { createBrowserHistory, createMemoryHistory, History } from '@remix-run/router';

/**
 * @deprecated - use useNavigate instead
 *
 * TODO: Using custom pre-instantiated history object with React Router 6+ is highly discouraged.
 * We should remove all usages of this history object and replace the current HistoryRouter impl.
 * (marked in React Router docs as unstable) with standard BrowserRouter impl.
 *
 * https://github.com/remix-run/react-router/pull/7586
 * https://github.com/remix-run/react-router/issues/9630#issuecomment-1341643731
 */
export const history: History =
  process.env.NODE_ENV !== 'test'
    ? createBrowserHistory({ v5Compat: true })
    : createMemoryHistory({ v5Compat: true });

const removeBasePath = (url = '/') =>
  _.startsWith(url, window.SERVER_FLAGS.basePath)
    ? url.slice(window.SERVER_FLAGS.basePath.length - 1)
    : url;

// Monkey patch history to slice off the base path
(history as any).__replace__ = history.replace;
history.replace = (url: string) => (history as any).__replace__(removeBasePath(url));

(history as any).__push__ = history.push;
history.push = (url: string) => (history as any).__push__(removeBasePath(url));

export const getQueryArgument = (arg: string) =>
  new URLSearchParams(window.location.search).get(arg);

/** @deprecated - use useNavigate instead */
export const setQueryArgument = (k: string, v: string) => {
  const params = new URLSearchParams(window.location.search);
  if (params.get(k) !== v) {
    if (v === '') {
      params.delete(k);
    } else {
      params.set(k, v);
    }
    const url = new URL(window.location.href);
    history.replace(`${url.pathname}?${params.toString()}${url.hash}`);
  }
};

/** @deprecated - use useNavigate instead */
export const setQueryArguments = (newParams: { [k: string]: string }) => {
  const params = new URLSearchParams(window.location.search);
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

/** @deprecated - use useNavigate instead */
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

/** @deprecated - use useNavigate instead */
export const removeQueryArgument = (k: string) => {
  const params = new URLSearchParams(window.location.search);
  if (params.has(k)) {
    params.delete(k);
    const url = new URL(window.location.href);
    history.replace(`${url.pathname}?${params.toString()}${url.hash}`);
  }
};

/** @deprecated - use useNavigate instead */
export const removeQueryArguments = (...keys: string[]) => {
  const params = new URLSearchParams(window.location.search);
  let update = false;
  keys.forEach((k) => {
    if (params.has(k)) {
      update = true;
      params.delete(k);
    }
  });
  if (update) {
    const url = new URL(window.location.href);
    history.replace(`${url.pathname}?${params.toString()}${url.hash}`);
  }
};

/** @deprecated - use useNavigate instead */
export const setOrRemoveQueryArgument = (k: string, v: string) =>
  v ? setQueryArgument(k, v) : removeQueryArgument(k);
