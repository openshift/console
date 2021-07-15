import * as React from 'react';
import * as _ from 'lodash';
import {
  Action,
  ActionGroup,
  ActionProvider,
  GroupVersionKind,
  isActionGroup,
  isActionProvider,
  isResourceActionProvider,
  ResourceActionProvider,
  useResolvedExtensions,
} from '@console/dynamic-plugin-sdk';
import { referenceForExtensionModel } from '@console/internal/module/k8s';
import { useExtensions } from '@console/plugin-sdk';
import { MenuOption } from '../menu/menu-types';
import { createMenuOptions } from '../menu/menu-utils';
import ActionsHookResolver from './ActionsHookResolver';

type ActionsLoaderProps = {
  contextId?: string;
  resourceKind?: GroupVersionKind;
  scope: any;
  children: (loader: Loader) => React.ReactNode;
};

type Loader = { actions: Action[]; options: MenuOption[]; loaded: boolean; error: any };

const ActionsLoader: React.FC<ActionsLoaderProps> = ({
  contextId,
  resourceKind,
  scope,
  children,
}) => {
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

  const resourceActionProviderGuard = React.useCallback(
    (e): e is ResourceActionProvider => {
      const modelKind = referenceForExtensionModel(e.properties.model);
      return isResourceActionProvider(e) && modelKind === resourceKind;
    },
    [resourceKind],
  );

  const [providerExtensions, providerExtensionsResolved] = useResolvedExtensions<ActionProvider>(
    actionProviderGuard,
  );

  const [resourceProviderExtensions, resourceProviderExtensionsResolved] = useResolvedExtensions<
    ResourceActionProvider
  >(resourceActionProviderGuard);

  const allProviderExtensions = [...providerExtensions, ...resourceProviderExtensions];
  const allProviderExtensionsResolved =
    providerExtensionsResolved && resourceProviderExtensionsResolved;

  const actionsLoaded =
    allProviderExtensionsResolved &&
    (allProviderExtensions.length === 0 ||
      allProviderExtensions.every(({ uid }) => actionsMap[uid]));

  const actions: Action[] = React.useMemo(() => _.flatten(Object.values(actionsMap)), [actionsMap]);

  const groupExtensions = useExtensions<ActionGroup>(isActionGroup);

  const options: MenuOption[] = React.useMemo(() => createMenuOptions(actions, groupExtensions), [
    actions,
    groupExtensions,
  ]);

  const loader = React.useMemo(
    () => ({
      actions,
      options,
      loaded: actionsLoaded,
      error: loadError,
    }),
    [actions, actionsLoaded, loadError, options],
  );

  return (
    <>
      {allProviderExtensionsResolved &&
        allProviderExtensions.map((extension) => (
          <ActionsHookResolver
            key={extension.uid}
            useValue={extension.properties.provider}
            scope={scope}
            onValueResolved={(value) => onProviderValueResolved(value, extension.uid)}
            onValueError={setLoadError}
          />
        ))}
      {children(loader)}
    </>
  );
};

export default ActionsLoader;
