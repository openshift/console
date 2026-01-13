import type { FC } from 'react';
import { useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import {
  isFeatureFlagHookProvider,
  FeatureFlagHookProvider,
  useResolvedExtensions,
  SetFeatureFlag,
} from '@console/dynamic-plugin-sdk';
import { setFlag } from '@console/internal/actions/flags';
import { useConsoleDispatch } from '@console/shared/src/hooks/useConsoleDispatch';
import { useConsoleSelector } from '@console/shared/src/hooks/useConsoleSelector';
import { FeatureFlagExtensionHookResolver } from './FeatureFlagExtensionHookResolver';

const useFeatureFlagController = () => {
  const dispatch = useConsoleDispatch();
  const flags = useConsoleSelector(({ FLAGS }) => FLAGS);

  // Keep a ref to the flags map to avoid time-of-check to time-of-use issues
  // and to keep the callback stable across flag updates
  const flagsRef = useRef(flags);

  // Queue of flag updates to be dispatched after render
  const pendingUpdatesRef = useRef<Map<string, boolean>>(new Map());

  useEffect(() => {
    flagsRef.current = flags;
  }, [flags]);

  // Process pending flag updates after render completes.
  // This avoids "Cannot update a component while rendering" errors with react-redux 8.x
  // because handlers are called during render (they use hooks) but dispatches happen after.
  useLayoutEffect(() => {
    pendingUpdatesRef.current.forEach((enabled, flag) => {
      if (flagsRef.current.get(flag) !== enabled) {
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

export const FeatureFlagExtensionLoader: FC = () => {
  const [flagProvider, flagProviderResolved] = useResolvedExtensions<FeatureFlagHookProvider>(
    isFeatureFlagHookProvider,
  );
  const featureFlagController = useFeatureFlagController();

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
