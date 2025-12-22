import type { ReactElement, ComponentType, FC } from 'react';
import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { getResizeObserver } from '@patternfly/react-core';
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
  const handleResize = useCallback(() => {
    const newWidth = measureRef.current.getBoundingClientRect().width;
    if (newWidth) {
      setWidth((oldWidth) =>
        Math.abs(oldWidth - newWidth) < resizeThreshold ? oldWidth : newWidth,
      );
    }
  }, [resizeThreshold]);
  const columnCount = useMemo(() => (width ? Math.floor(width / columnWidth) || 1 : null), [
    columnWidth,
    width,
  ]);

  useEffect(() => {
    handleResize();

    // change the column count if the window is resized
    const observer = getResizeObserver(undefined, handleResize, true);
    return () => observer();
  }, [handleResize]);

  const columns: ReactElement[] =
    loading && LoadingComponent
      ? Array.from({ length: columnCount }, (_, i) => <LoadingComponent key={i.toString()} />)
      : children;

  return (
    <div className="odc-masonry-container" ref={measureRef}>
      {columnCount ? <Masonry columnCount={columnCount}>{columns}</Masonry> : null}
    </div>
  );
};
