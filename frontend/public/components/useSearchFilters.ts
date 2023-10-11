import { useDeepCompareMemoize } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useDeepCompareMemoize';
import { useState, useMemo, useCallback } from 'react';
import { setOrRemoveQueryArgument } from './utils';
import { RowSearchFilter } from '@console/dynamic-plugin-sdk/src/extensions/console-types';

/**
 * Handles a state management hack-fix around the label filters auto complete field.
 * Fixes https://bugzilla.redhat.com/show_bug.cgi?id=2070720
 * TODO: Refactor FilterToolbar to use proper state management: https://issues.redhat.com/browse/CONSOLE-3147
 *
 * This is a hack fix due to the violation in state management in FilterToolbar. This hook should
 * be deleted once proper React state management has been implemented.
 */
const useSearchFilters = (searchFilters: RowSearchFilter[], uniqueFilterName: string) => {
  const searchFiltersObject = useMemo(
    () =>
      (searchFilters || []).reduce((acc, filter) => {
        acc[filter?.type] = filter;
        return acc;
      }, {} as { [key: string]: RowSearchFilter }),
    [searchFilters],
  );

  const queryParams = useDeepCompareMemoize(new URLSearchParams(location.search));

  const searchFiltersValues: { [filterName: string]: string } = useMemo(
    () =>
      (searchFilters || []).reduce((acc, filter) => {
        const queryKey = uniqueFilterName ? `${uniqueFilterName}-${filter?.type}` : filter?.type;
        const queryValue = queryParams.get(queryKey);

        if (queryValue) {
          acc[filter?.type] = queryValue;
        }
        return acc;
      }, {}),
    [queryParams, uniqueFilterName, searchFilters],
  );

  const [searchFiltersState, setSearchFiltersState] = useState(searchFiltersValues);

  const changeSearchFiltersState = useCallback(
    (filterName: string, value: string) => {
      setSearchFiltersState((state) => ({
        ...state,
        [filterName]: value,
      }));
      setTimeout(
        () =>
          setOrRemoveQueryArgument(
            uniqueFilterName ? `${uniqueFilterName}-${filterName}` : filterName,
            value,
          ),
        0,
      );
    },
    [setSearchFiltersState, uniqueFilterName],
  );

  const flushSearchFiltersState = useCallback(() => {
    setSearchFiltersState({});
  }, []);

  return {
    searchFiltersObject,
    searchFiltersState,
    changeSearchFiltersState,
    flushSearchFiltersState,
  };
};

export default useSearchFilters;
