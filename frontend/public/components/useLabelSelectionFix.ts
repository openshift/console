import * as React from 'react';
import useMirroredLocalState, { UseMirroredLocalStateReturn } from './useMirroredLocalState';
import { setOrRemoveQueryArgument } from './utils';

/**
 * Handles a state management hack-fix around the label filters auto complete field.
 * Fixes https://bugzilla.redhat.com/show_bug.cgi?id=2070720
 * TODO: Refactor FilterToolbar to use proper state management: https://issues.redhat.com/browse/CONSOLE-3147
 *
 * This is a hack fix due to the violation in state management in FilterToolbar. This hook should
 * be deleted once proper React state management has been implemented.
 */
const useLabelSelectorFix = (
  params: URLSearchParams,
  labelFilterQueryArgumentKey: string,
): UseMirroredLocalStateReturn<string[]> => {
  const syncSearchParams = React.useCallback(
    (values: string[]) => {
      setOrRemoveQueryArgument(labelFilterQueryArgumentKey, values.join(','));
    },
    [labelFilterQueryArgumentKey],
  );

  const labelFilters = params.get(labelFilterQueryArgumentKey)?.split(',') ?? [];

  return useMirroredLocalState<string[]>({
    externalState: labelFilters,
    externalChangeHandler: syncSearchParams,
    defaultState: [],
  });
};

export default useLabelSelectorFix;
