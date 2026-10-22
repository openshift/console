import type { FC, ComponentType, CSSProperties } from 'react';
import { forwardRef, memo, useCallback, useEffect, useState } from 'react';
import { css } from '@patternfly/react-styles';
import {
  AutoSizer,
  List as VirtualList,
  WindowScroller,
  CellMeasurer,
  CellMeasurerCache,
} from 'react-virtualized';
import type { EventKind } from '../../module/k8s';
import { WithScrollContainer } from './dom-utils';

// Keep track of seen events so we only animate new ones.
const seen = new Set();

const measurementCache = new CellMeasurerCache({
  fixedWidth: true,
});

const arePropsEqual = (prev: SysEventContentProps, next: SysEventContentProps) => {
  if (prev.event.lastTimestamp !== next.event.lastTimestamp) {
    // Timestamps can be modified because events can be combined.
    return false;
  }
  // `style` and `className` are applied by the SysEvent wrapper, which rerenders
  // with every CellMeasurer pass, so they are intentionally not compared here.
  // Comparing `style` would rerender unchanged rows while recomputeRowHeights()
  // transiently rewrites row styles during streaming updates.
  return (
    prev.EventComponent === next.EventComponent &&
    prev.index === next.index &&
    prev.list === next.list
  );
};

// CellMeasurer clones the element returned by its render prop and attaches a
// new callback ref to it on every render. React only takes the memo bailout
// when the ref is unchanged, so the memoized content must live in a separate
// component that never receives CellMeasurer's ref. SysEvent below is the thin
// ref-forwarding wrapper that CellMeasurer measures.
const SysEventContent = memo(
  ({ EventComponent, event, list, index }: SysEventContentProps) => (
    <EventComponent event={event} list={list} cache={measurementCache} index={index} />
  ),
  arePropsEqual,
);

const SysEvent = forwardRef<HTMLDivElement, SysEventProps>(
  ({ EventComponent, className, event, index, list, style }, ref) => {
    const key = event.metadata.uid;
    // Only animate events if they're at the start of the list (first 6) and we
    // haven't seen them before. The decision is made once per mount so
    // rerenders don't drop the class mid-animation.
    const [shouldAnimate] = useState(() => !seen.has(key) && index < 6);

    useEffect(() => {
      if (shouldAnimate) {
        seen.add(key);
      }
      // Don't memory-leak the seen set while streaming.
      return () => {
        seen.delete(key);
      };
    }, [key, shouldAnimate]);

    return (
      <div
        className={css(
          { 'co-sysevent-slide-in': shouldAnimate },
          'co-sysevent--transition',
          className,
        )}
        ref={ref}
        style={style}
      >
        <SysEventContent EventComponent={EventComponent} event={event} index={index} list={list} />
      </div>
    );
  },
);
SysEvent.displayName = 'SysEvent';

export const EventStreamList: FC<EventStreamListProps> = ({
  events,
  className,
  EventComponent,
}) => {
  const [list, setList] = useState(null);
  const onResize = useCallback(() => measurementCache.clearAll(), []);
  useEffect(() => {
    onResize();
    list?.recomputeRowHeights();
  }, [list, events, onResize]);
  const rowRenderer = useCallback(
    ({ index, style, key, parent }) => (
      <CellMeasurer
        cache={measurementCache}
        columnIndex={0}
        key={key}
        rowIndex={index}
        parent={parent}
      >
        {() => (
          <SysEvent
            className={className}
            event={events[index]}
            list={list}
            EventComponent={EventComponent}
            key={key}
            style={style}
            index={index}
          />
        )}
      </CellMeasurer>
    ),
    [events, className, EventComponent, list],
  );

  const renderVirtualizedTable = (scrollContainer) => (
    <WindowScroller scrollElement={scrollContainer}>
      {({ height, isScrolling, registerChild, onChildScroll, scrollTop }) => (
        <AutoSizer disableHeight onResize={onResize}>
          {({ width }) => (
            <div ref={registerChild}>
              <VirtualList
                className="co-sysevent-slide-in"
                autoHeight
                data={events}
                deferredMeasurementCache={measurementCache}
                height={height || 0}
                isScrolling={isScrolling}
                onScroll={onChildScroll}
                ref={setList}
                rowCount={events.length}
                rowHeight={measurementCache.rowHeight}
                rowRenderer={rowRenderer}
                scrollTop={scrollTop}
                tabIndex={null}
                width={width}
              />
            </div>
          )}
        </AutoSizer>
      )}
    </WindowScroller>
  );

  return events.length > 0 && <WithScrollContainer>{renderVirtualizedTable}</WithScrollContainer>;
};

type EventStreamListProps = {
  events: EventKind[];
  EventComponent: ComponentType<EventComponentProps>;
  className?: string;
};

export type EventComponentProps = {
  event: EventKind;
  list: VirtualList;
  cache: CellMeasurerCache;
  index: number;
};

type SysEventContentProps = {
  EventComponent: ComponentType<EventComponentProps>;
  event: EventKind;
  index: number;
  list: VirtualList;
};

type SysEventProps = SysEventContentProps & {
  className?: string;
  style: CSSProperties;
};
