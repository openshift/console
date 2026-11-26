import type { FC } from 'react';
import { memo, useEffect } from 'react';
import type { ExtensionHook, Action } from '@console/dynamic-plugin-sdk';

type ActionsHookResolverProps = {
  scope: any;
  useValue: ExtensionHook<Action[]>;
  onValueResolved: (value: Action[]) => void;
  onContextChange: (contextId: string, scope: any) => void;
  onValueError: (error: any) => void;
};

/**
 * Resolves a single action provider hook and reports its value.
 *
 * Memoized so it only re-renders (re-running the provider hook) when its scope
 * or the provider itself changes. Provider hooks may return new value
 * identities on every run, so re-running them in response to unrelated state
 * updates creates a self-sustaining setState loop.
 */
const ActionsHookResolver: FC<ActionsHookResolverProps> = ({
  useValue,
  scope,
  onValueResolved,
  onValueError,
}) => {
  const [value, loaded, loadError] = useValue(scope);

  useEffect(() => {
    if (loaded) onValueResolved(value);
    // We do not want to run the effect every time onValueResolved changes
    // eslint-disable-next-line react-hooks-js/exhaustive-deps
  }, [loaded, value]);

  useEffect(() => {
    if (loadError) onValueError(loadError);
    // We do not want to run the effect every time onValueError changes
    // eslint-disable-next-line react-hooks-js/exhaustive-deps
  }, [loadError]);

  return null;
};

export default memo(ActionsHookResolver);
