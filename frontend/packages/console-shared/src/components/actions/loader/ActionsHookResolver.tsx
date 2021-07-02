import * as React from 'react';
import { ExtensionHook, Action } from '@console/dynamic-plugin-sdk';

type ActionsHookResolverProps = {
  scope: any;
  useValue: ExtensionHook<Action[]>;
  onValueResolved: (value: Action[]) => void;
  onValueError: (error: any) => void;
};

const ActionsHookResolver: React.FC<ActionsHookResolverProps> = ({
  useValue,
  scope,
  onValueResolved,
  onValueError,
}) => {
  const [value, loaded, loadError] = useValue(scope);

  React.useEffect(() => {
    if (loaded) onValueResolved(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, value]);

  React.useEffect(() => {
    if (loadError) onValueError(loadError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadError]);

  return null;
};

export default ActionsHookResolver;
