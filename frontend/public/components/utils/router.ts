import * as _ from 'lodash';
import { useCallback, useRef } from 'react';
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
 * All mutation functions only trigger updates when values actually change.
 * All mutations use replace mode to avoid polluting browser history.
 * All mutations preserve both location.state and location.hash to maintain navigation context.
 *
 * Performance optimizations:
 * - Uses useRef to access current location without recreating callbacks on every location change
 * - Prevents unnecessary re-renders by maintaining stable function references
 * - Only triggers navigation when query parameters actually change
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
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Use ref to access current location without adding it to dependency arrays
  // This prevents callbacks from being recreated on every location change
  const locationRef = useRef(location);
  locationRef.current = location;

  const getQueryArgument = useCallback((arg: string) => searchParams.get(arg), [searchParams]);

  const setQueryArgument = useCallback(
    (k: string, v: string) => {
      const current = searchParams.get(k);
      if (current !== v) {
        const updated = new URLSearchParams(searchParams);
        if (v === '') {
          updated.delete(k);
        } else {
          updated.set(k, v);
        }
        const loc = locationRef.current;
        navigate(`${loc.pathname}?${updated.toString()}${loc.hash}`, {
          replace: true,
          state: loc.state,
        });
      }
    },
    [searchParams, navigate],
  );

  const setQueryArguments = useCallback(
    (newParams: { [k: string]: string }) => {
      const updated = new URLSearchParams(searchParams);
      let changed = false;
      _.each(newParams, (v, k) => {
        if (updated.get(k) !== v) {
          changed = true;
          updated.set(k, v);
        }
      });
      if (changed) {
        const loc = locationRef.current;
        navigate(`${loc.pathname}?${updated.toString()}${loc.hash}`, {
          replace: true,
          state: loc.state,
        });
      }
    },
    [searchParams, navigate],
  );

  const setAllQueryArguments = useCallback(
    (newParams: { [k: string]: string }) => {
      const updated = new URLSearchParams();
      _.each(newParams, (v, k) => {
        updated.set(k, v);
      });
      // Early return if new params are identical to current params
      const updatedString = updated.toString();
      const currentString = searchParams.toString();
      if (updatedString === currentString) {
        return;
      }
      const loc = locationRef.current;
      navigate(`${loc.pathname}?${updatedString}${loc.hash}`, {
        replace: true,
        state: loc.state,
      });
    },
    [searchParams, navigate],
  );

  const removeQueryArgument = useCallback(
    (k: string) => {
      if (searchParams.has(k)) {
        const updated = new URLSearchParams(searchParams);
        updated.delete(k);
        const loc = locationRef.current;
        navigate(`${loc.pathname}?${updated.toString()}${loc.hash}`, {
          replace: true,
          state: loc.state,
        });
      }
    },
    [searchParams, navigate],
  );

  const removeQueryArguments = useCallback(
    (...keys: string[]) => {
      const updated = new URLSearchParams(searchParams);
      let changed = false;
      keys.forEach((k) => {
        if (updated.has(k)) {
          changed = true;
          updated.delete(k);
        }
      });
      if (changed) {
        const loc = locationRef.current;
        navigate(`${loc.pathname}?${updated.toString()}${loc.hash}`, {
          replace: true,
          state: loc.state,
        });
      }
    },
    [searchParams, navigate],
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
 * @deprecated Use useQueryParamsMutator().getQueryArgument instead.
 *
 * This legacy function directly reads from window.location and cannot react to changes.
 * It should only be used in non-React contexts (utilities, helpers, tests).
 *
 * Migration guide:
 * ```typescript
 * // Before (legacy):
 * import { getQueryArgument } from './router';
 * const value = getQueryArgument('key');
 *
 * // After (React components):
 * import { useQueryParamsMutator } from './router';
 * const { getQueryArgument } = useQueryParamsMutator();
 * const value = getQueryArgument('key');
 * ```
 *
 * All usages in React components should be migrated to the hook-based approach
 * for React Router v6/v7 compatibility and proper reactivity to URL changes.
 */
export const getQueryArgument = (arg: string) =>
  new URLSearchParams(window.location.search).get(arg);
