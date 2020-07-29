import { useEffect } from 'react';

/**
 * Hook which adds and remove a beforeunload listener depending on the lock flag.
 */
export const usePreventDataLossLock = (lock: boolean) => {
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Chrome requires returnValue to be set
      // from https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onbeforeunload
      e.returnValue = '';
    };
    if (lock) {
      window.addEventListener('beforeunload', onBeforeUnload);
    }
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [lock]);
};
