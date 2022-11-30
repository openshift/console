import * as React from 'react';

export const useResizeObserver = (
  callback: ResizeObserverCallback,
  targetElement?: HTMLElement | null,
): void => {
  const element = React.useMemo(() => targetElement ?? document.querySelector('body'), [
    targetElement,
  ]);
  React.useEffect(() => {
    const observer = new ResizeObserver(callback);
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [callback, element]);
};
