import { FC, useCallback, useRef, useEffect } from 'react';
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
  const flags = useConsoleSelector(({ FLAGS }) => FLAGS);

  // Keep a ref to the flags map to avoid time-of-check to time-of-use issues
  // if the flags change between render and the callback being invoked
  const flagsRef = useRef(flags);

  useEffect(() => {
    flagsRef.current = flags;
  }, [flags]);

  return useCallback<SetFeatureFlag>(
    (flag, enabled) => {
      // Defer dispatch to next event loop tick to avoid "Cannot update a component
      // while rendering a different component" error
      queueMicrotask(() => {
        if (flagsRef.current.get(flag) === enabled) {
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
