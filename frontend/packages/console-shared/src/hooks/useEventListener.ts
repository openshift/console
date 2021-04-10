import { useEffect } from 'react';

export const useEventListener = (
  target: EventTarget,
  event: keyof WindowEventMap,
  callback: EventListener,
) => {
  useEffect(() => {
    target.addEventListener(event, callback);
    return () => {
      target.removeEventListener(event, callback);
    };
  }, [target, event, callback]);
};
