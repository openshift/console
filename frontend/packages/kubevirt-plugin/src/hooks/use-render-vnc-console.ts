import * as React from 'react';
import { useLocalStorage } from './use-local-storage';

interface RenderVNCConsoleArguments {
  vmName: string;
  shouldBeFullScreen: boolean;
  initValue?: boolean;
}

export const useRenderVNCConsole = ({
  vmName,
  shouldBeFullScreen,
}: RenderVNCConsoleArguments): boolean => {
  const localStorageItemKey = `isFullScreenVNC-${vmName}`;
  const [localStorageValue, updateLocalStorageValue] = useLocalStorage(localStorageItemKey);
  const value = !!localStorageValue || shouldBeFullScreen;

  React.useEffect(() => {
    shouldBeFullScreen && vmName && updateLocalStorageValue('true');
  }, [localStorageItemKey, shouldBeFullScreen, updateLocalStorageValue, vmName]);

  return shouldBeFullScreen ? value : !value;
};
