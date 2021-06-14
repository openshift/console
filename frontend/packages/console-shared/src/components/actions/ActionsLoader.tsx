import * as React from 'react';
import * as _ from 'lodash';
import {
  Action,
  ActionProvider,
  isActionProvider,
  useResolvedExtensions,
} from '@console/dynamic-plugin-sdk';
import ActionsHookResolver from './ActionsHookResolver';

type ActionsLoaderProps = {
  contextId: string;
  scope: any;
  children: (actions: Action[], loaded: boolean, error: any) => React.ReactNode;
};

const ActionsLoader: React.FC<ActionsLoaderProps> = ({ contextId, scope, children }) => {
  const [actionsMap, setActionsMap] = React.useState<{ [uid: string]: Action[] }>({});
  const [loadError, setLoadError] = React.useState<any>();

  const onProviderValueResolved = React.useCallback((actions: Action[], uid: string) => {
    setActionsMap((prev) => ({ ...prev, [uid]: actions }));
  }, []);

  const actionProviderGuard = React.useCallback(
    (e): e is ActionProvider => {
      return isActionProvider(e) && e.properties.contextId === contextId;
    },
    [contextId],
  );

  const [providerExtensions, providerExtensionsResolved] = useResolvedExtensions<ActionProvider>(
    actionProviderGuard,
  );

  const actionsLoaded =
    providerExtensionsResolved &&
    (providerExtensions.length === 0 || providerExtensions.every(({ uid }) => actionsMap[uid]));

  const actions: Action[] = React.useMemo(() => _.flatten(Object.values(actionsMap)), [actionsMap]);

  return (
    <>
      {providerExtensionsResolved &&
        providerExtensions.map((extension) => (
          <ActionsHookResolver
            key={extension.uid}
            useValue={extension.properties.provider}
            scope={scope}
            onValueResolved={(value) => onProviderValueResolved(value, extension.uid)}
            onValueError={setLoadError}
          />
        ))}
      {children(actions, actionsLoaded, loadError)}
    </>
  );
};

export default ActionsLoader;
