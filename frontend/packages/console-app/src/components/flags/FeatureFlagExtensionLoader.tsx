import type { FC } from 'react';
import { useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import {
  isFeatureFlagHookProvider,
  FeatureFlagHookProvider,
  isModelFeatureFlag,
  ModelFeatureFlag,
  FeatureFlag,
  isFeatureFlag,
  SetFeatureFlag,
  useResolvedExtensions,
} from '@console/dynamic-plugin-sdk';
import type { ResolvedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { setFlag, updateModelFlags } from '@console/internal/actions/flags';
import { useCompareExtensions } from '@console/plugin-sdk/src/utils/useCompareExtensions';
import { useConsoleDispatch } from '@console/shared/src/hooks/useConsoleDispatch';
import { useConsoleSelector } from '@console/shared/src/hooks/useConsoleSelector';
import { FeatureFlagExtensionHookResolver } from './FeatureFlagExtensionHookResolver';

/**
 * React hook that returns a stable {@link SetFeatureFlag} callback.
 */
const useFeatureFlagController = () => {
  const dispatch = useConsoleDispatch();
  const flags = useConsoleSelector(({ FLAGS }) => FLAGS);

  // Queue of flag updates to be dispatched after render
  const pendingUpdatesRef = useRef<Map<string, boolean>>(new Map());

  // Process pending flag updates after render completes.
  // This avoids "Cannot update a component while rendering" errors with react-redux 8.x
  // because handlers are called during render (they use hooks) but dispatches happen after.
  useLayoutEffect(() => {
    pendingUpdatesRef.current.forEach((enabled, flag) => {
      if (flags.get(flag) !== enabled) {
        dispatch(setFlag(flag, enabled));
      }
    });
    pendingUpdatesRef.current.clear();
  });

  return useCallback<SetFeatureFlag>((flag, enabled) => {
    // Queue the update to be processed after render
    pendingUpdatesRef.current.set(flag, enabled);
  }, []);
};

/**
 * React hook that processes {@link FeatureFlag} extensions and invokes their
 * handlers.
 */
const useFeatureFlagExtensions = (featureFlagController: SetFeatureFlag) => {
  const handleChange = useCallback(
    (added: ResolvedExtension<FeatureFlag>[]) => {
      added.forEach(({ properties: { handler }, pluginName }) => {
        try {
          handler(featureFlagController);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error(`FeatureFlag handler from plugin ${pluginName} threw an error:`, e);
        }
      });
    },
    [featureFlagController],
  );

  const [resolvedExtensions] = useResolvedExtensions(isFeatureFlag);

  useCompareExtensions(resolvedExtensions, handleChange);
};

/**
 * React hook that processes {@link ModelFeatureFlag} extensions and dispatches
 * model flag updates.
 */
const useModelFeatureFlagExtensions = () => {
  const dispatch = useConsoleDispatch();
  const models = useConsoleSelector(({ k8s }) => k8s.getIn(['RESOURCES', 'models']));

  // Use a ref to always access the current models value without changing the callback identity
  const modelsRef = useRef(models);
  useEffect(() => {
    modelsRef.current = models;
  }, [models]);

  const handleChange = useCallback(
    (
      added: ResolvedExtension<ModelFeatureFlag>[],
      removed: ResolvedExtension<ModelFeatureFlag>[],
    ) => {
      // The feature reducer can't access state from the k8s reducer, so get the
      // models here and include them in the action payload.
      dispatch(updateModelFlags(added, removed, modelsRef.current));
    },
    [dispatch],
  );

  const [resolvedExtensions] = useResolvedExtensions(isModelFeatureFlag);

  useCompareExtensions(resolvedExtensions, handleChange);
};

/**
 * Responsible for {@link FeatureFlagHookProvider}, {@link FeatureFlag},
 * and {@link ModelFeatureFlag} extensions.
 */
export const FeatureFlagExtensionLoader: FC = () => {
  const [flagProvider, flagProviderResolved] = useResolvedExtensions<FeatureFlagHookProvider>(
    isFeatureFlagHookProvider,
  );
  const featureFlagController = useFeatureFlagController();

  useFeatureFlagExtensions(featureFlagController);
  useModelFeatureFlagExtensions();

  if (flagProviderResolved) {
    return (
      <>
        {flagProvider.map((nf) => {
          const {
            properties: { handler },
            uid,
          } = nf;
          return (
            <FeatureFlagExtensionHookResolver
              key={uid}
              handler={handler}
              setFeatureFlag={featureFlagController}
            />
          );
        })}
      </>
    );
  }
  return null;
};
