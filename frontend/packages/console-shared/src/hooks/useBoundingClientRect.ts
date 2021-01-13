import * as React from 'react';
import { useResizeObserver } from './useResizeObserver';

type BoundingClientRect = ClientRect | null;

export const useBoundingClientRect = (targetElement: HTMLElement | null): BoundingClientRect => {
  const [clientRect, setClientRect] = React.useState<BoundingClientRect>(() =>
    targetElement ? targetElement.getBoundingClientRect() : null,
  );

  const observerCallback = React.useCallback(() => {
    setClientRect(targetElement ? targetElement.getBoundingClientRect() : null);
  }, [targetElement]);

  useResizeObserver(observerCallback);

  return clientRect;
};
