import * as React from 'react';

export const useEventListener = (
  eventTarget: EventTarget,
  event: keyof WindowEventMap,
  cb: EventListener,
): void => {
  React.useEffect(() => {
    eventTarget.addEventListener(event, cb);
    return () => {
      eventTarget.removeEventListener(event, cb);
    };
  }, [cb, event, eventTarget]);
};
