import { FC, useCallback, useRef } from 'react';
import {
  isFeatureFlagHookProvider,
  FeatureFlagHookProvider,
  useResolvedExtensions,
  SetFeatureFlag,
} from '@console/dynamic-plugin-sdk';
import { setFlag } from '@console/internal/actions/flags';
import { useConsoleDispatch, useConsoleSelector } from '../../hooks/redux';
import { FeatureFlagExtensionHookResolver } from './FeatureFlagExtensionHookResolver';

const useFeatureFlagController = () => {
  const dispatch = useConsoleDispatch();
  const flagsRef = useRef(null);

  // Update the ref without causing re-renders by using a custom equality function
  // that always returns true (preventing re-renders while still updating the ref)
  useConsoleSelector(
    ({ FLAGS }) => {
      flagsRef.current = FLAGS;
      return FLAGS;
    },
    () => true, // Always return true to prevent re-renders, we only want the ref updated
  );

  // Return a stable callback that won't change, preventing unnecessary re-renders
  // of components using this callback
  return useCallback<SetFeatureFlag>(
    (flag, enabled) => {
      // Defer dispatch to next event loop tick to avoid "Cannot update a component
      // while rendering a different component" error
      queueMicrotask(() => {
        if (flagsRef.current?.get(flag) === enabled) {
          return;
        }
        dispatch(setFlag(flag, enabled));
      });
    },
    [dispatch],
  );
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
