import type { FC } from 'react';
import { useCallback, useRef, useEffect } from 'react';
import type {
  FeatureFlagHookProvider,
  ModelFeatureFlag,
  FeatureFlag,
  SetFeatureFlag,
} from '@console/dynamic-plugin-sdk';
import {
  isFeatureFlagHookProvider,
  isModelFeatureFlag,
  isFeatureFlag,
  useResolvedExtensions,
} from '@console/dynamic-plugin-sdk';
import type { ResolvedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { setFlag, updateModelFlags } from '@console/internal/actions/flags';
import type { OnChange } from '@console/plugin-sdk/src/utils/useCompareExtensions';
import { useCompareExtensions } from '@console/plugin-sdk/src/utils/useCompareExtensions';
import { useConsoleDispatch } from '@console/shared/src/hooks/useConsoleDispatch';
import { useConsoleSelector } from '@console/shared/src/hooks/useConsoleSelector';
import { FeatureFlagExtensionHookResolver } from './FeatureFlagExtensionHookResolver';

/**
 * React hook that returns a stable {@link SetFeatureFlag} callback.
 *
 * Updates are always flushed on a microtask so handlers invoked during render
 * (including child FeatureFlagExtensionHookResolver re-renders) never dispatch
 * synchronously, while async callers (e.g. after a fetch in a
 * console.flag/hookProvider) still update without waiting for an unrelated re-render.
 */
export const useFeatureFlagController = () => {
  const dispatch = useConsoleDispatch();

  const pendingUpdatesRef = useRef<Map<string, boolean>>(new Map());
  const flushScheduledRef = useRef(false);

  const flushPendingUpdates = useCallback(() => {
    // Detach the current batch first so reentrant setFeatureFlag calls during
    // dispatch (e.g. Redux subscribers) write into a fresh map and can schedule a
    // follow-up flush instead of being cleared with this batch.
    const updates = pendingUpdatesRef.current;
    pendingUpdatesRef.current = new Map();
    flushScheduledRef.current = false;
    updates.forEach((enabled, flag) => {
      dispatch(setFlag(flag, enabled));
    });
  }, [dispatch]);

  const scheduleFlush = useCallback(() => {
    if (flushScheduledRef.current) {
      return;
    }
    flushScheduledRef.current = true;
    queueMicrotask(() => {
      flushPendingUpdates();
    });
  }, [flushPendingUpdates]);

  return useCallback<SetFeatureFlag>(
    (flag, enabled) => {
      pendingUpdatesRef.current.set(flag, enabled);
      scheduleFlush();
    },
    [scheduleFlush],
  );
};

/**
 * React hook that processes {@link FeatureFlag} extensions and invokes their
 * handlers.
 */
const useFeatureFlagExtensions = (featureFlagController: SetFeatureFlag) => {
  const [resolvedExtensions] = useResolvedExtensions(isFeatureFlag);

  const handleChange = useCallback<OnChange<ResolvedExtension<FeatureFlag>>>(
    (added) => {
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

  useCompareExtensions(resolvedExtensions, handleChange);
};

/**
 * React hook that processes {@link ModelFeatureFlag} extensions and dispatches
 * model flag updates.
 */
const useModelFeatureFlagExtensions = () => {
  const [resolvedExtensions] = useResolvedExtensions(isModelFeatureFlag);

  const dispatch = useConsoleDispatch();
  const models = useConsoleSelector(({ k8s }) => k8s.getIn(['RESOURCES', 'models']));

  // Use a ref to always access the current models value without changing the callback identity
  const modelsRef = useRef(models);
  useEffect(() => {
    modelsRef.current = models;
  }, [models]);

  const handleChange = useCallback<OnChange<ModelFeatureFlag>>(
    (added, removed) => {
      // The feature reducer can't access state from the k8s reducer, so get the
      // models here and include them in the action payload.
      dispatch(updateModelFlags(added, removed, modelsRef.current));
    },
    [dispatch],
  );

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
