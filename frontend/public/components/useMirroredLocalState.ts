import * as React from 'react';
import * as _ from 'lodash';

export type UseMirroredLocalStateReturn<S> = [S, (state: S) => void, boolean];

/**
 * DO NOT USE -- proper state management in React is Top-Down state management.
 * Syncs an external data point with a local data point. Used to fix the ToolbarFilter poor state
 * management issue.
 */
const useMirroredLocalState = <S>({
  externalState,
  externalChangeHandler,
  defaultState,
}: {
  externalState: S;
  externalChangeHandler: (state: S) => void;
  defaultState: S;
}): UseMirroredLocalStateReturn<S> => {
  const [localState, setLocalState] = React.useState<S>(null);

  const onExternalChange = React.useCallback(
    (state: S) => {
      setLocalState(state);
      externalChangeHandler(state);
    },
    [externalChangeHandler],
  );

  React.useEffect(() => {
    if (localState === null) {
      // We don't have local data, fresh mount
      if (_.isEmpty(externalState)) {
        // No url params, use defaults
        onExternalChange(defaultState);
      } else {
        // We have url params, routed here with params
        setLocalState(externalState);
      }
    } else {
      // We have local data so we have been initialized
      if (!_.isEqual(externalState, localState)) {
        // They are not equal, so we need to figure out who is right
        if (_.isEmpty(externalState)) {
          // Params are empty, so this means the component was not re-mounted but we lost params
          onExternalChange(localState);
        } else {
          // Params are not empty -- this is a conflict of source of truth
          // Possible reason would be a local code re-route on this page, accept URL as source of truth
          setLocalState(externalState);
        }
      }
    }
  }, [localState, externalState, onExternalChange, defaultState]);

  return [localState ?? defaultState, onExternalChange, localState !== null];
};

export default useMirroredLocalState;
