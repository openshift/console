import type { FC, RefCallback } from 'react';
import { useState, useCallback, useEffect } from 'react';
import { getResizeObserver } from '@patternfly/react-core';

interface ContentRect {
  bounds: {
    readonly width: number;
    readonly height: number;
  };
}

interface MeasuredComponentProps {
  measureRef: RefCallback<HTMLDivElement>;
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
  // The measured node is tracked as state (set through a callback ref during
  // commit) so that no ref value is handed to the render prop. `measureRef`
  // is only meant to be attached to the DOM by children, e.g.
  // `<div ref={measureRef}>`.
  const [measureNode, setMeasureNode] = useState<HTMLDivElement | null>(null);
  const [contentRect, setContentRect] = useState<ContentRect>({
    bounds: { width: 0, height: 0 },
  });

  const updateRect = useCallback(() => {
    const { width, height } = measureNode?.getBoundingClientRect() ?? {
      width: 0,
      height: 0,
    };
    setContentRect({ bounds: { width, height } });
    onResize && onResize({ bounds: { width, height } });
  }, [onResize, measureNode]);

  useEffect(() => {
    if (!measureNode) {
      return;
    }
    // eslint-disable-next-line react-hooks-js/set-state-in-effect -- contentRect reflects DOM measurements (getBoundingClientRect) that are only available after the element is committed; this initial measurement plus the resize observer subscription is the component's whole purpose, and the setState re-renders with the measured bounds
    updateRect();
    const resizeObserver = getResizeObserver(measureNode, updateRect, true);
    return () => {
      resizeObserver();
    };
  }, [updateRect, measureNode]);

  return <>{children && children({ measureRef: setMeasureNode, contentRect })}</>;
};

export default MeasureBounds;
