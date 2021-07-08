import * as React from 'react';
import Measure, { ContentRect } from 'react-measure';
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
  const [width, setWidth] = React.useState<number>(0);
  const onResize = React.useCallback(
    (contentRect: ContentRect) => {
      const newWidth = contentRect.bounds?.width;
      if (newWidth) {
        setWidth((oldWidth) =>
          Math.abs(oldWidth - newWidth) < resizeThreshold ? oldWidth : newWidth,
        );
      }
    },
    [resizeThreshold],
  );
  const columnCount = React.useMemo(() => (width ? Math.floor(width / columnWidth) || 1 : null), [
    columnWidth,
    width,
  ]);

  const columns: React.ReactElement[] =
    loading && LoadingComponent
      ? Array.from({ length: columnCount }, (_, i) => <LoadingComponent key={i.toString()} />)
      : children;

  return (
    <Measure bounds onResize={onResize}>
      {({ measureRef }) => (
        <div className="odc-masonry-container" ref={measureRef}>
          {columnCount ? <Masonry columnCount={columnCount}>{columns}</Masonry> : null}
        </div>
      )}
    </Measure>
  );
};
