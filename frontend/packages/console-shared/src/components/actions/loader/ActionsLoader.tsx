import * as React from 'react';
import * as _ from 'lodash';
import {
  Action,
  ActionProvider,
  isActionProvider,
  isResourceActionProvider,
  ResourceActionProvider,
  useResolvedExtensions,
} from '@console/dynamic-plugin-sdk';
import { referenceForExtensionModel } from '@console/internal/module/k8s';
import ActionsHookResolver from './ActionsHookResolver';

type ActionsLoaderProps = {
  contextId: string;
  scope: any;
  onActionsLoaded: (actions: Action[]) => void;
  onContextChange: (contextId: string, scope: any) => void;
  onLoadError: (error: any) => void;
};

const ActionsLoader: React.FC<ActionsLoaderProps> = ({
  contextId,
  scope,
  onActionsLoaded,
  onContextChange,
  onLoadError,
}) => {
  const [actionsMap, setActionsMap] = React.useState<{ [uid: string]: Action[] }>({});
  const [loadError, setLoadError] = React.useState<any>();

  const onProviderValueResolved = React.useCallback((actions: Action[], uid: string) => {
    setActionsMap((prev) => ({ ...prev, [uid]: actions }));
  }, []);

  const providerGuard = React.useCallback(
    (e): e is ActionProvider => isActionProvider(e) && e.properties.contextId === contextId,
    [contextId],
  );

  const resourceProviderGuard = React.useCallback(
    (e): e is ResourceActionProvider =>
      isResourceActionProvider(e) && referenceForExtensionModel(e.properties.model) === contextId,
    [contextId],
  );

  const [providerExtensions, providerExtensionsResolved] = useResolvedExtensions<ActionProvider>(
    providerGuard,
  );

  const [resourceProviderExtensions, resourceProviderExtensionsResolved] = useResolvedExtensions<
    ResourceActionProvider
  >(resourceProviderGuard);

  const allProviderExtensions = [...providerExtensions, ...resourceProviderExtensions];
  const allProviderExtensionsResolved =
    providerExtensionsResolved && resourceProviderExtensionsResolved;

  const actionsLoaded =
    allProviderExtensionsResolved &&
    (allProviderExtensions.length === 0 ||
      allProviderExtensions.every(({ uid }) => actionsMap[uid]));

  const actions: Action[] = React.useMemo(() => _.flatten(Object.values(actionsMap)), [actionsMap]);

  React.useEffect(() => {
    if (actionsLoaded) onActionsLoaded?.(actions);
    // We do not want to run the effect every time onActionsLoaded changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, actionsLoaded]);

  React.useEffect(() => {
    if (loadError) onLoadError(loadError);
    // We do not want to run the effect every time onLoadError changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadError]);

  return (
    <>
      {allProviderExtensionsResolved &&
        allProviderExtensions.map((extension) => (
          <ActionsHookResolver
            key={extension.uid}
            useValue={extension.properties.provider}
            scope={scope}
            onValueResolved={(value) => onProviderValueResolved(value, extension.uid)}
            onContextChange={onContextChange}
            onValueError={setLoadError}
          />
        ))}
    </>
  );
};

export default ActionsLoader;
