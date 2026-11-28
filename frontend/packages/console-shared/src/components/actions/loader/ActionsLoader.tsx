import type { FC } from 'react';
import { useState, useCallback, useMemo, useEffect, useRef, memo } from 'react';
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
  onActionsLoaded: (actions: Action[], contextId: string) => void;
  onContextChange: (contextId: string, scope: any) => void;
  onLoadError: (error: any) => void;
};

/**
 * Loads actions for a single action context.
 *
 * Memoized with stable props so state updates in the parent
 * `ActionServiceProvider` do not re-run the provider hooks. Provider hooks are
 * not required to return referentially stable values, so re-running them on
 * every parent render would feed new value identities back into state forever
 * (an infinite update loop under React 19's synchronous effect flushing).
 */
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

  const [providerExtensions, providerExtensionsResolved] =
    useResolvedExtensions<ActionProvider>(providerGuard);

  const [filterExtensions, filterExtensionsResolved] =
    useResolvedExtensions<ActionFilter>(filterGuard);

  const [resourceProviderExtensions, resourceProviderExtensionsResolved] =
    useResolvedExtensions<ResourceActionProvider>(resourceProviderGuard);

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
    if (actionsLoaded) onActionsLoaded?.(actions, contextId);
    // We do not want to run the effect every time onActionsLoaded changes
    // eslint-disable-next-line react-hooks-js/exhaustive-deps
  }, [actions, actionsLoaded]);

  useEffect(() => {
    if (loadError) onLoadError(loadError);
    // We do not want to run the effect every time onLoadError changes
    // eslint-disable-next-line react-hooks-js/exhaustive-deps
  }, [loadError]);

  // Cache per-extension resolved callbacks so the resolvers receive stable
  // props and are not re-rendered (re-running their provider hooks) when this
  // loader re-renders due to its own state updates.
  const resolverCallbacksRef = useRef(new Map<string, (value: Action[]) => void>());
  const getOnValueResolved = useCallback(
    (uid: string) => {
      let cb = resolverCallbacksRef.current.get(uid);
      if (!cb) {
        cb = (value: Action[]) => onProviderValueResolved(value, uid);
        resolverCallbacksRef.current.set(uid, cb);
      }
      return cb;
    },
    [onProviderValueResolved],
  );

  return (
    <>
      {allProviderExtensionsResolved &&
        allProviderExtensions.map((extension) => (
          <ActionsHookResolver
            key={extension.uid}
            useValue={extension.properties.provider}
            scope={scope}
            // eslint-disable-next-line react-hooks-js/refs -- reads the cached stable callback for this uid; the cache is append-only and does not affect rendering
            onValueResolved={getOnValueResolved(extension.uid)}
            onContextChange={onContextChange}
            onValueError={setLoadError}
          />
        ))}
    </>
  );
};

export default memo(ActionsLoader);
