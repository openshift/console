import { useState, useCallback } from 'react';
import { useResizeObserver } from './useResizeObserver';

type BoundingClientRect = ClientRect | null;

export const useBoundingClientRect = (targetElement: HTMLElement | null): BoundingClientRect => {
  const [clientRect, setClientRect] = useState<BoundingClientRect>(() =>
    targetElement ? targetElement.getBoundingClientRect() : null,
  );

  const observerCallback = useCallback(() => {
    setClientRect(targetElement ? targetElement.getBoundingClientRect() : null);
  }, [targetElement]);

  useResizeObserver(observerCallback);

  return clientRect;
};
