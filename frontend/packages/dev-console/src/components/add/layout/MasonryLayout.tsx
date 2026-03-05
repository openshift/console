import type { ReactElement, ComponentType, FC } from 'react';
import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { getResizeObserver } from '@patternfly/react-core';
import { useDebounceCallback } from '@console/shared/src/hooks/debounce';
import { Masonry } from './Masonry';
import './MasonryLayout.scss';

type MasonryLayoutProps = {
  columnWidth: number;
  children: ReactElement[];
  loading?: boolean;
  LoadingComponent?: ComponentType<any>;
  /**
   * This threshold ensures that the resize doesn't happen to often.
   * It is set to 30 pixels by default to ensure that the column count is not
   * changed back and forward if a scrollbar appears or disappears depending on
   * the content width and height. In some edge cases this could result in an
   * endless rerendering (which is also visible to the user as a flickering UI).
   */
  resizeThreshold?: number;
};

export const MasonryLayout: FC<MasonryLayoutProps> = ({
  columnWidth,
  children,
  loading,
  LoadingComponent,
  resizeThreshold = 30,
}) => {
  const measureRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>(0);

  const updateWidth = useCallback(() => {
    if (!measureRef.current) return;
    const newWidth = measureRef.current.getBoundingClientRect().width;
    if (newWidth) {
      setWidth((oldWidth) =>
        Math.abs(oldWidth - newWidth) < resizeThreshold ? oldWidth : newWidth,
      );
    }
  }, [resizeThreshold]);

  const handleResize = useDebounceCallback(updateWidth, 100);
  const columnCount = useMemo(() => (width ? Math.floor(width / columnWidth) || 1 : null), [
    columnWidth,
    width,
  ]);

  useEffect(() => {
    if (!measureRef.current) return undefined;

    // Ensure initial measurement happens after DOM is ready and painted
    const rafId = requestAnimationFrame(() => {
      handleResize();
    });

    // Observe container resizes using ResizeObserver
    // Pass false for useRequestAnimationFrame since handleResize is already debounced
    const observer = getResizeObserver(measureRef.current, handleResize, false);

    return () => {
      cancelAnimationFrame(rafId);
      handleResize.cancel();
      observer();
    };
    // Only run once on mount - handleResize is stable but adding it would cause unnecessary re-subscriptions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns: ReactElement[] =
    loading && LoadingComponent
      ? Array.from({ length: columnCount || 1 }, (_, i) => <LoadingComponent key={i.toString()} />)
      : children;

  return (
    <div className="odc-masonry-container" ref={measureRef}>
      {columnCount && <Masonry columnCount={columnCount}>{columns}</Masonry>}
    </div>
  );
};
