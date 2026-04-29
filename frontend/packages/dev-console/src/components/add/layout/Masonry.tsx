import type { ReactElement, FC } from 'react';
import { useState, Children, useRef, useEffect, memo, useCallback } from 'react';
import { css } from '@patternfly/react-styles';
import './MasonryLayout.scss';

interface MasonryProps {
  columnCount: number;
  children: ReactElement[];
}

interface MeasuredItemProps {
  item: ReactElement;
  itemKey: string;
  onHeightMeasured: (key: string, height: number) => void;
  currentHeight?: number;
}

// Define MeasuredItem OUTSIDE the render function to prevent recreating it on every render
const MeasuredItem = memo<MeasuredItemProps>(
  ({ item, itemKey, onHeightMeasured, currentHeight }) => {
    const measureRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!measureRef.current) return undefined;

      let rafId: number;

      // Use ResizeObserver to detect DOM height changes from internal toggles
      const resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;

        // Use requestAnimationFrame to batch updates and avoid ResizeObserver loop errors
        if (rafId) {
          cancelAnimationFrame(rafId);
        }

        rafId = requestAnimationFrame(() => {
          const newHeight = entry.contentRect.height;
          // Only update if height changed by more than 1px to avoid sub-pixel rendering loops
          if (!currentHeight || Math.abs(currentHeight - newHeight) > 1) {
            onHeightMeasured(itemKey, newHeight);
          }
        });
      });

      resizeObserver.observe(measureRef.current);

      return () => {
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
        resizeObserver.disconnect();
      };
    }, [itemKey, onHeightMeasured, currentHeight]);

    return <div ref={measureRef}>{item}</div>;
  },
);

export const Masonry: FC<MasonryProps> = ({ columnCount, children }) => {
  const [heights, setHeights] = useState<Record<string, number>>({});
  const columns = columnCount || 1;
  const setHeight = useCallback((key: string, height: number) => {
    setHeights((old) => {
      if (old[key] === height) return old; // Prevent unnecessary updates
      return { ...old, [key]: height };
    });
  }, []);
  const groupedColumns = Array.from({ length: columns }, (_, idx) => ({
    id: `masonry-column-${idx.toString()}`,
    height: 0,
    items: [] as ReactElement[],
  }));

  let added = false;
  let allRendered = true;
  Children.forEach(children, (item: ReactElement, itemIndex) => {
    const itemKey = (item.key as string) ?? itemIndex.toString();
    const measuredItem = (
      <MeasuredItem
        key={itemKey}
        item={item}
        itemKey={itemKey}
        onHeightMeasured={setHeight}
        currentHeight={heights[itemKey]}
      />
    );

    // Fill first row directly
    if (itemIndex < columns) {
      groupedColumns[itemIndex].height += heights[itemKey] || 0;
      groupedColumns[itemIndex].items.push(measuredItem);
      return;
    }

    // Search for the column with lowest height
    const column = groupedColumns.reduce(
      (prev, curr) => (curr.height < prev.height ? curr : prev),
      groupedColumns[0],
    );

    // Add column which height is already known
    if (heights[itemKey]) {
      column.height += heights[itemKey];
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
      {groupedColumns.map((groupedColumn) => (
        <div
          key={groupedColumn.id}
          className="odc-masonry-layout__column"
          data-test="masonry-column"
        >
          {groupedColumn.items}
        </div>
      ))}
    </div>
  );
};
