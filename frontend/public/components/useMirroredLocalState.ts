import { useState, useCallback, useEffect } from 'react';
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
  const [localState, setLocalState] = useState<S>(null);

  const onExternalChange = useCallback(
    (state: S) => {
      setLocalState(state);
      externalChangeHandler(state);
    },
    [externalChangeHandler],
  );

  if (localState === null) {
    // Fresh mount: adopt the url params, or the defaults when there are none
    setLocalState(_.isEmpty(externalState) ? defaultState : externalState);
  } else if (!_.isEqual(externalState, localState) && !_.isEmpty(externalState)) {
    // We have local data and the params are not empty, so this is a conflict
    // of source of truth (e.g. a local code re-route) -- accept the url as
    // the source of truth
    setLocalState(externalState);
  }

  // The external system (the url) is only ever written from an effect.
  useEffect(() => {
    if (localState !== null && !_.isEqual(externalState, localState) && _.isEmpty(externalState)) {
      // The params are empty, so the component was not re-mounted but we lost
      // the params -- push the local state back out
      externalChangeHandler(localState);
    }
  }, [localState, externalState, externalChangeHandler]);

  return [localState ?? defaultState, onExternalChange, localState !== null];
};

export default useMirroredLocalState;
