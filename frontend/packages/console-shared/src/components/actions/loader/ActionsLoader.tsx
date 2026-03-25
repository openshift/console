import type { FC } from 'react';
import { useState, useCallback, useMemo, useEffect } from 'react';
import * as _ from 'lodash';
import type {
  Action,
  ActionProvider,
  ResourceActionProvider,
  ExtensionK8sGroupModel,
  ActionFilter,
} from '@console/dynamic-plugin-sdk';
import {
  isActionProvider,
  isResourceActionProvider,
  useResolvedExtensions,
  isActionFilter,
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

const ActionsLoader: FC<ActionsLoaderProps> = ({
  contextId,
  scope,
  onActionsLoaded,
  onContextChange,
  onLoadError,
}) => {
  const [actionsMap, setActionsMap] = useState<{ [uid: string]: Action[] }>({});
  const [loadError, setLoadError] = useState<any>();

  const onProviderValueResolved = useCallback((actions: Action[], uid: string) => {
    setActionsMap((prev) => ({ ...prev, [uid]: actions }));
  }, []);

  const providerGuard = useCallback(
    (e): e is ActionProvider => isActionProvider(e) && e.properties.contextId === contextId,
    [contextId],
  );

  const filterGuard = useCallback(
    (e): e is ActionFilter => isActionFilter(e) && e.properties.contextId === contextId,
    [contextId],
  );

  const resourceProviderGuard = useCallback(
    (e): e is ResourceActionProvider =>
      isResourceActionProvider(e) &&
      referenceForExtensionModel(e.properties.model as ExtensionK8sGroupModel) === contextId,
    [contextId],
  );

  const [providerExtensions, providerExtensionsResolved] = useResolvedExtensions<ActionProvider>(
    providerGuard,
  );

  const [filterExtensions, filterExtensionsResolved] = useResolvedExtensions<ActionFilter>(
    filterGuard,
  );

  const [resourceProviderExtensions, resourceProviderExtensionsResolved] = useResolvedExtensions<
    ResourceActionProvider
  >(resourceProviderGuard);

  const allProviderExtensions = [...providerExtensions, ...resourceProviderExtensions];
  const allProviderExtensionsResolved =
    providerExtensionsResolved && resourceProviderExtensionsResolved && filterExtensionsResolved;

  const actionsLoaded =
    allProviderExtensionsResolved &&
    (allProviderExtensions.length === 0 ||
      allProviderExtensions.every(({ uid }) => actionsMap[uid]));

  const actions: Action[] = useMemo(() => {
    const flattenedActions = _.flatten(Object.values(actionsMap));
    return filterExtensions?.length > 0
      ? flattenedActions.filter((a) =>
          filterExtensions.some((ext) => ext.properties.filter(scope, a)),
        )
      : flattenedActions;
  }, [actionsMap, filterExtensions, scope]);

  useEffect(() => {
    if (actionsLoaded) onActionsLoaded?.(actions);
    // We do not want to run the effect every time onActionsLoaded changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, actionsLoaded]);

  useEffect(() => {
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
