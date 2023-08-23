import * as React from 'react';
import * as cx from 'classnames';
import Measure from 'react-measure';
import './MasonryLayout.scss';

type MasonryProps = {
  columnCount: number;
  children: React.ReactElement[];
};

export const Masonry: React.FC<MasonryProps> = ({ columnCount, children }) => {
  const [heights, setHeights] = React.useState<Record<string, number>>({});
  const columns = columnCount || 1;
  const setHeight = (key: string, height: number) => {
    setHeights((old) => ({ ...old, [key]: height }));
  };
  const groupedColumns = Array.from({ length: columns }, () => ({
    height: 0,
    items: [] as React.ReactElement[],
  }));

  let added = false;
  let allRendered = true;
  React.Children.forEach(children, (item, itemIndex) => {
    // Fill first row directly
    if (itemIndex < columns) {
      groupedColumns[itemIndex].height += heights[item.key as string] || 0;
      groupedColumns[itemIndex].items.push(item);
      return;
    }

    // Search for the column with lowest height
    const column = groupedColumns.reduce(
      (prev, curr) => (curr.height < prev.height ? curr : prev),
      groupedColumns[0],
    );

    // Add column which height is already known
    if (item.key && heights[item.key]) {
      column.height += heights[item.key];
      column.items.push(item);
      return;
    }

    // Add one more item which height is not known yet.
    if (!added) {
      column.items.push(item);
      added = true;
    } else {
      allRendered = false;
    }
  });

  return (
    <div className={cx('odc-masonry-layout', { 'odc-masonry-layout__allRendered': allRendered })}>
      {groupedColumns.map((groupedColumn, columnIndex) => (
        <div key={columnIndex.toString()} className="odc-masonry-layout__column">
          {groupedColumn.items.map((item) => (
            <Measure
              key={item.key}
              bounds
              onResize={(contentRect) => setHeight(item.key as string, contentRect.bounds?.height)}
            >
              {({ measureRef }) => <div ref={measureRef}>{item}</div>}
            </Measure>
          ))}
        </div>
      ))}
    </div>
  );
};
