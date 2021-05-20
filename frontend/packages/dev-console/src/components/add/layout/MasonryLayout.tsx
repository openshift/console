import * as React from 'react';
import Measure from 'react-measure';
import { Masonry } from './Masonry';
import './MasonryLayout.scss';

type MasonryLayoutProps = {
  columnWidth: number;
  children: React.ReactElement[];
};

export const MasonryLayout: React.FC<MasonryLayoutProps> = ({ columnWidth, children }) => {
  const [width, setWidth] = React.useState<number>(0);
  const columnCount = React.useMemo(() => (width ? Math.floor(width / columnWidth) || 1 : null), [
    columnWidth,
    width,
  ]);

  return (
    <Measure bounds onResize={(contentRect) => setWidth(contentRect.bounds?.width)}>
      {({ measureRef }) => (
        <div className="odc-masonry-container" ref={measureRef}>
          {columnCount ? <Masonry columnsCount={columnCount}>{children}</Masonry> : null}
        </div>
      )}
    </Measure>
  );
};
