import { useEffect } from 'react';

export const useEventListener = (
  target: EventTarget | null | undefined, // <-- Safe type definition
  event: keyof WindowEventMap | keyof DocumentEventMap,
  callback: EventListener,
) => {
  useEffect(() => {
    if (!target) return; // <-- Safe guard against null/undefined targets!

    target.addEventListener(event, callback);
    return () => {
      target.removeEventListener(event, callback);
    };
  }, [target, event, callback]);
};
