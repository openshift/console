import type { ReactElement, FC } from 'react';
import { useState, Children, useRef, useEffect, useCallback } from 'react';
import { css } from '@patternfly/react-styles';
import './MasonryLayout.scss';

type MasonryProps = {
  columnCount: number;
  children: ReactElement[];
};

interface MeasuredItemProps {
  item: ReactElement;
  itemKey: string;
  onMeasure: (key: string, height: number) => void;
}

// Stable component definition - prevents unmount/remount cycles
const MeasuredItem: FC<MeasuredItemProps> = ({ item, itemKey, onMeasure }) => {
  const measureRef = useRef<HTMLDivElement>(null);
  const lastHeightRef = useRef<number>(0);

  useEffect(() => {
    const newHeight = measureRef.current?.getBoundingClientRect().height;
    if (newHeight && lastHeightRef.current !== newHeight) {
      lastHeightRef.current = newHeight;
      onMeasure(itemKey, newHeight);
    }
  }, [itemKey, onMeasure]);

  return <div ref={measureRef}>{item}</div>;
};

export const Masonry: FC<MasonryProps> = ({ columnCount, children }) => {
  const [heights, setHeights] = useState<Record<string, number>>({});
  const columns = columnCount || 1;

  // Memoize setHeight to prevent useEffect re-runs in MeasuredItem
  const setHeight = useCallback((key: string, height: number) => {
    setHeights((old) => ({ ...old, [key]: height }));
  }, []);
  const groupedColumns = Array.from({ length: columns }, () => ({
    height: 0,
    items: [] as ReactElement[],
  }));

  let added = false;
  let allRendered = true;
  Children.forEach(children, (item: ReactElement, itemIndex) => {
    // Use consistent key for both React reconciliation and height tracking
    const effectiveKey = (item.key ?? itemIndex).toString();

    const measuredItem = (
      <MeasuredItem key={effectiveKey} item={item} itemKey={effectiveKey} onMeasure={setHeight} />
    );

    // Fill first row directly
    if (itemIndex < columns) {
      groupedColumns[itemIndex].height += heights[effectiveKey] || 0;
      groupedColumns[itemIndex].items.push(measuredItem);
      return;
    }

    // Search for the column with lowest height
    const column = groupedColumns.reduce(
      (prev, curr) => (curr.height < prev.height ? curr : prev),
      groupedColumns[0],
    );

    // Add column which height is already known
    if (heights[effectiveKey]) {
      column.height += heights[effectiveKey];
      column.items.push(measuredItem);
      return;
    }

    // Add one more item which height is not known yet.
    if (!added) {
      column.items.push(measuredItem);
      added = true;
    } else {
      allRendered = false;
    }
  });

  return (
    <div className={css('odc-masonry-layout', { 'odc-masonry-layout__allRendered': allRendered })}>
      {groupedColumns.map((groupedColumn, columnIndex) => (
        <div key={columnIndex.toString()} className="odc-masonry-layout__column">
          {groupedColumn.items}
        </div>
      ))}
    </div>
  );
};
