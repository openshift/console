import * as React from 'react';
import { useEventListener } from '@console/shared/src/hooks/useEventListener';
import { Masonry } from './Masonry';
import './MasonryLayout.scss';

type MasonryLayoutProps = {
  columnWidth: number;
  children: React.ReactElement[];
  loading?: boolean;
  LoadingComponent?: React.FC;
  /**
   * This threshold ensures that the resize doesn't happen to often.
   * It is set to 30 pixels by default to ensure that the column count is not
   * changed back and forward if a scrollbar appears or disappears depending on
   * the content width and height. In some edge cases this could result in an
   * endless rerendering (which is also visible to the user as a flickering UI).
   */
  resizeThreshold?: number;
};

export const MasonryLayout: React.FCC<MasonryLayoutProps> = ({
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
  const columnCount = React.useMemo(() => (width ? Math.floor(width / columnWidth) || 1 : 1), [
    columnWidth,
    width,
  ]);

  React.useEffect(() => {
    handleResize();
  }, [handleResize]);

  // Listen for window resize events to update column count
  useEventListener(window, 'resize', handleResize);

  const columns: React.ReactElement[] =
    loading && LoadingComponent
      ? Array.from({ length: columnCount }, (_, i) => <LoadingComponent key={i.toString()} />)
      : children;

  return (
    <div className="odc-masonry-container" ref={measureRef}>
      <Masonry columnCount={columnCount}>{columns}</Masonry>
    </div>
  );
};
