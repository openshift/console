import * as _ from 'lodash';
import { useCallback, useRef } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router';

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
 * const { setQueryArgument, removeQueryArgument } = useQueryParamsMutator();
 *
 * const handleFilterChange = (value: string) => {
 *   setQueryArgument('filter', value);
 * };
 * ```
 */
export const useQueryParamsMutator = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Use refs to access current location and searchParams without adding them to dependency arrays
  // This prevents callbacks from being recreated on every location/searchParams change
  const locationRef = useRef(location);
  locationRef.current = location;

  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  const getQueryArgument = useCallback((arg: string) => searchParamsRef.current.get(arg), []);

  const setQueryArgument = useCallback(
    (k: string, v: string) => {
      const current = searchParamsRef.current.get(k);
      if (current !== v) {
        const updated = new URLSearchParams(searchParamsRef.current);
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
    [navigate],
  );

  const setQueryArguments = useCallback(
    (newParams: { [k: string]: string }) => {
      const updated = new URLSearchParams(searchParamsRef.current);
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
    [navigate],
  );

  const setAllQueryArguments = useCallback(
    (newParams: { [k: string]: string }) => {
      const updated = new URLSearchParams();
      _.each(newParams, (v, k) => {
        updated.set(k, v);
      });
      // Early return if new params are identical to current params
      const updatedString = updated.toString();
      const currentString = searchParamsRef.current.toString();
      if (updatedString === currentString) {
        return;
      }
      const loc = locationRef.current;
      navigate(`${loc.pathname}?${updatedString}${loc.hash}`, {
        replace: true,
        state: loc.state,
      });
    },
    [navigate],
  );

  const removeQueryArgument = useCallback(
    (k: string) => {
      if (searchParamsRef.current.has(k)) {
        const updated = new URLSearchParams(searchParamsRef.current);
        updated.delete(k);
        const loc = locationRef.current;
        navigate(`${loc.pathname}?${updated.toString()}${loc.hash}`, {
          replace: true,
          state: loc.state,
        });
      }
    },
    [navigate],
  );

  const removeQueryArguments = useCallback(
    (...keys: string[]) => {
      const updated = new URLSearchParams(searchParamsRef.current);
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
    [navigate],
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
