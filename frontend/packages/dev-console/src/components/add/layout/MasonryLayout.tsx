import * as React from 'react';
import { getResizeObserver } from '@patternfly/react-core';
import { Masonry } from './Masonry';
import './MasonryLayout.scss';

type MasonryLayoutProps = {
  columnWidth: number;
  children: React.ReactElement[];
  loading?: boolean;
  LoadingComponent?: React.ComponentType<any>;
  /**
   * This threshold ensures that the resize doesn't happen to often.
   * It is set to 30 pixels by default to ensure that the column count is not
   * changed back and forward if a scrollbar appears or disappears depending on
   * the content width and height. In some edge cases this could result in an
   * endless rerendering (which is also visible to the user as a flickering UI).
   */
  resizeThreshold?: number;
};

export const MasonryLayout: React.FC<MasonryLayoutProps> = ({
  columnWidth,
  children,
  loading,
  LoadingComponent,
  resizeThreshold = 30,
}) => {
  const measureRef = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState<number>(0);
  const handleResize = React.useCallback(() => {
    const newWidth = measureRef.current?.getBoundingClientRect().width ?? 0;
    if (newWidth) {
      setWidth((oldWidth) =>
        Math.abs(oldWidth - newWidth) < resizeThreshold ? oldWidth : newWidth,
      );
    }
  }, [resizeThreshold]);
  const columnCount = React.useMemo(() => (width ? Math.floor(width / columnWidth) || 1 : null), [
    columnWidth,
    width,
  ]);

  React.useEffect(() => {
    handleResize();

    // change the column count if the window is resized
    const observer = getResizeObserver(undefined as any, handleResize, true);
    return () => observer();
  }, [handleResize]);

  const columns: React.ReactElement[] =
    loading && LoadingComponent
      ? Array.from({ length: columnCount ?? 0 }, (_, i) => <LoadingComponent key={i.toString()} />)
      : children;

  return (
    <div className="odc-masonry-container" ref={measureRef}>
      {columnCount ? <Masonry columnCount={columnCount}>{columns}</Masonry> : null}
    </div>
  );
};
