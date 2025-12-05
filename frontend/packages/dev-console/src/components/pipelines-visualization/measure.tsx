import * as React from 'react';
import { getResizeObserver } from '@patternfly/react-core';

interface ContentRect {
  bounds: {
    readonly width: number;
    readonly height: number;
  };
}

interface MeasuredComponentProps {
  measureRef: React.MutableRefObject<HTMLDivElement | null>;
  contentRect: ContentRect;
}

interface MeasureProps {
  /** callback function to get the size of the element */
  onResize?(contentRect: ContentRect): void;
  /** child component */
  children?: React.FC<MeasuredComponentProps> | undefined;
}

/**
 * Limited clone of `react-measure` to measure the bounds of a component
 */
const MeasureBounds: React.FCC<MeasureProps> = ({ onResize, children }) => {
  const measureRef = React.useRef<HTMLDivElement>(null);
  const [contentRect, setContentRect] = React.useState<ContentRect>({
    bounds: { width: 0, height: 0 },
  });

  const updateRect = React.useCallback(() => {
    const { width, height } = measureRef?.current?.getBoundingClientRect();
    setContentRect({ bounds: { width, height } });
    onResize && onResize({ bounds: { width, height } });
  }, [onResize]);

  React.useEffect(() => {
    updateRect();
    const resizeObserver = getResizeObserver(measureRef.current, updateRect, true);
    return () => {
      resizeObserver();
    };
  }, [updateRect]);

  return <>{children && children({ measureRef, contentRect })}</>;
};

export default MeasureBounds;
