import type { FC, MutableRefObject } from 'react';
import { useRef, useState, useCallback, useEffect } from 'react';
import { getResizeObserver } from '@patternfly/react-core';

interface ContentRect {
  bounds: {
    readonly width: number;
    readonly height: number;
  };
}

interface MeasuredComponentProps {
  measureRef: MutableRefObject<HTMLDivElement | null>;
  contentRect: ContentRect;
}

interface MeasureProps {
  /** callback function to get the size of the element */
  onResize?(contentRect: ContentRect): void;
  /** child component */
  children?: FC<MeasuredComponentProps> | undefined;
}

/**
 * Limited clone of `react-measure` to measure the bounds of a component
 */
const MeasureBounds: FC<MeasureProps> = ({ onResize, children }) => {
  const measureRef = useRef<HTMLDivElement>(null);
  const [contentRect, setContentRect] = useState<ContentRect>({
    bounds: { width: 0, height: 0 },
  });

  const updateRect = useCallback(() => {
    const { width, height } = measureRef?.current?.getBoundingClientRect();
    setContentRect({ bounds: { width, height } });
    onResize && onResize({ bounds: { width, height } });
  }, [onResize]);

  useEffect(() => {
    updateRect();
    const resizeObserver = getResizeObserver(measureRef.current, updateRect, true);
    return () => {
      resizeObserver();
    };
  }, [updateRect]);

  return <>{children && children({ measureRef, contentRect })}</>;
};

export default MeasureBounds;
