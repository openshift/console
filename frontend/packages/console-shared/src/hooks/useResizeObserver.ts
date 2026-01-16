import { useMemo, useEffect } from 'react';

export const useResizeObserver = (
  callback: ResizeObserverCallback,
  targetElement?: HTMLElement | null,
): void => {
  const element = useMemo(() => targetElement ?? document.querySelector('body'), [targetElement]);
  useEffect(() => {
    const observer = new ResizeObserver(callback);
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [callback, element]);
};
