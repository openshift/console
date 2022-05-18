import * as React from 'react';
import * as _ from 'lodash';
import useMirroredLocalState, { UseMirroredLocalStateReturn } from './useMirroredLocalState';
import { setOrRemoveQueryArgument } from './utils';

/**
 * Handles a state management hack-fix around the row filters dropdown.
 * Fixes https://bugzilla.redhat.com/show_bug.cgi?id=2070720
 * TODO: Refactor FilterToolbar to use proper state management: https://issues.redhat.com/browse/CONSOLE-3147
 *
 * This is a hack fix due to the violation in state management in FilterToolbar. This hook should
 * be deleted once proper React state management has been implemented.
 */
const useRowFilterFix = (
  params: URLSearchParams,
  filters: { [key: string]: string[] },
  filterKeys: { [key: string]: string },
  defaultSelections: string[],
): UseMirroredLocalStateReturn<string[]> => {
  const syncRowFilterParams = React.useCallback(
    (selected) => {
      _.forIn(filters, (value, key) => {
        const recognized = _.filter(selected, (item) => value.includes(item));
        setOrRemoveQueryArgument(filterKeys[key], recognized.join(','));
      });
    },
    [filters, filterKeys],
  );

  const selectedRowFilters = _.flatMap(filterKeys, (f) => params.get(f)?.split(',') ?? []);

  return useMirroredLocalState<string[]>({
    externalChangeHandler: syncRowFilterParams,
    externalState: selectedRowFilters,
    defaultState: defaultSelections,
  });
};

export default useRowFilterFix;
