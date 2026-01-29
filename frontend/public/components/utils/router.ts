import * as _ from 'lodash';
import { useCallback } from 'react';
import { createBrowserHistory, createMemoryHistory, History } from 'history';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom-v5-compat';

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

export const history: History = createHistory({ basename: window.SERVER_FLAGS.basePath });

const removeBasePath = (url = '/') =>
  _.startsWith(url, window.SERVER_FLAGS.basePath)
    ? url.slice(window.SERVER_FLAGS.basePath.length - 1)
    : url;

// Monkey patch history to slice off the base path
(history as any).__replace__ = history.replace;
history.replace = (url: string) => (history as any).__replace__(removeBasePath(url));

(history as any).__push__ = history.push;
history.push = (url: string) => (history as any).__push__(removeBasePath(url));

/**
 * Hook providing query parameter mutation functions compatible with React Router v6/v7.
 * Uses useSearchParams from react-router-dom-v5-compat for React Router v6+ compatibility.
 *
 * All mutation functions preserve the URL hash and only trigger updates when values actually change.
 * All mutations use replace mode to avoid polluting browser history.
 *
 * @returns Object with query parameter getter and mutation functions
 *
 * @example
 * ```typescript
 * const \{ setQueryArgument, removeQueryArgument \} = useQueryParamsMutator();
 *
 * const handleFilterChange = (value: string) =\> \{
 *   setQueryArgument('filter', value);
 * \};
 * ```
 */
export const useQueryParamsMutator = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const getQueryArgument = useCallback((arg: string) => searchParams.get(arg), [searchParams]);

  const setQueryArgument = useCallback(
    (k: string, v: string) => {
      const current = searchParams.get(k);
      if (current !== v) {
        setSearchParams(
          (prev) => {
            const updated = new URLSearchParams(prev);
            if (v === '') {
              updated.delete(k);
            } else {
              updated.set(k, v);
            }
            return updated;
          },
          { replace: true, state: location.state },
        );
      }
    },
    [searchParams, setSearchParams, location.state],
  );

  const setQueryArguments = useCallback(
    (newParams: { [k: string]: string }) => {
      setSearchParams(
        (prev) => {
          const updated = new URLSearchParams(prev);
          let changed = false;
          _.each(newParams, (v, k) => {
            if (updated.get(k) !== v) {
              changed = true;
              updated.set(k, v);
            }
          });
          return changed ? updated : prev;
        },
        { replace: true, state: location.state },
      );
    },
    [setSearchParams, location.state],
  );

  const setAllQueryArguments = useCallback(
    (newParams: { [k: string]: string }) => {
      const updated = new URLSearchParams();
      _.each(newParams, (v, k) => {
        updated.set(k, v);
      });
      setSearchParams(updated, { replace: true, state: location.state });
    },
    [setSearchParams, location.state],
  );

  const removeQueryArgument = useCallback(
    (k: string) => {
      if (searchParams.has(k)) {
        setSearchParams(
          (prev) => {
            const updated = new URLSearchParams(prev);
            updated.delete(k);
            return updated;
          },
          { replace: true, state: location.state },
        );
      }
    },
    [searchParams, setSearchParams, location.state],
  );

  const removeQueryArguments = useCallback(
    (...keys: string[]) => {
      setSearchParams(
        (prev) => {
          const updated = new URLSearchParams(prev);
          let changed = false;
          keys.forEach((k) => {
            if (updated.has(k)) {
              changed = true;
              updated.delete(k);
            }
          });
          return changed ? updated : prev;
        },
        { replace: true, state: location.state },
      );
    },
    [setSearchParams, location.state],
  );

  const setOrRemoveQueryArgument = useCallback(
    (k: string, v: string) => {
      if (v) {
        setQueryArgument(k, v);
      } else {
        removeQueryArgument(k);
      }
    },
    [setQueryArgument, removeQueryArgument],
  );

  return {
    getQueryArgument,
    setQueryArgument,
    setQueryArguments,
    setAllQueryArguments,
    removeQueryArgument,
    removeQueryArguments,
    setOrRemoveQueryArgument,
  };
};

/**
 * Hook providing navigation function for programmatic navigation.
 * Replacement for direct history.push() calls.
 *
 * @returns Function that navigates to a URL
 *
 * @example
 * ```typescript
 * const navigateTo = useRouterPush();
 *
 * const handleClick = () =\> \{
 *   navigateTo('/some/path');
 * \};
 * ```
 */
export const useRouterPush = () => {
  const navigate = useNavigate();
  return useCallback((url: string) => navigate(url), [navigate]);
};

export const getQueryArgument = (arg: string) =>
  new URLSearchParams(window.location.search).get(arg);

/**
 * @deprecated Use useQueryParamsMutator hook instead for React Router v6/v7 compatibility.
 * This function will be removed in a future version.
 */
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

/**
 * @deprecated Use useQueryParamsMutator hook instead for React Router v6/v7 compatibility.
 * This function will be removed in a future version.
 */
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

/**
 * @deprecated Use useQueryParamsMutator hook instead for React Router v6/v7 compatibility.
 * This function will be removed in a future version.
 */
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

/**
 * @deprecated Use useQueryParamsMutator hook instead for React Router v6/v7 compatibility.
 * This function will be removed in a future version.
 */
export const removeQueryArgument = (k: string) => {
  const params = new URLSearchParams(window.location.search);
  if (params.has(k)) {
    params.delete(k);
    const url = new URL(window.location.href);
    history.replace(`${url.pathname}?${params.toString()}${url.hash}`);
  }
};

/**
 * @deprecated Use useQueryParamsMutator hook instead for React Router v6/v7 compatibility.
 * This function will be removed in a future version.
 */
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

/**
 * @deprecated Use useQueryParamsMutator hook instead for React Router v6/v7 compatibility.
 * This function will be removed in a future version.
 */
export const setOrRemoveQueryArgument = (k: string, v: string) =>
  v ? setQueryArgument(k, v) : removeQueryArgument(k);
