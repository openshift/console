import type { FC } from 'react';
import { useEffect } from 'react';
import type { ExtensionHook, Action } from '@console/dynamic-plugin-sdk';

type ActionsHookResolverProps = {
  scope: any;
  useValue: ExtensionHook<Action[]>;
  onValueResolved: (value: Action[]) => void;
  onContextChange: (contextId: string, scope: any) => void;
  onValueError: (error: any) => void;
};

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, value]);

  useEffect(() => {
    if (loadError) onValueError(loadError);
    // We do not want to run the effect every time onValueError changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadError]);

  return null;
};

export default ActionsHookResolver;
