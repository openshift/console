import type { FC, ComponentType, CSSProperties } from 'react';
import { forwardRef, memo, useEffect, useState, useCallback } from 'react';
import { css } from '@patternfly/react-styles';
import * as _ from 'lodash';
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

const SysEvent = forwardRef<HTMLDivElement, SysEventProps>(
  ({ EventComponent, index, style, event, className, list }, ref) => {
    let shouldAnimate: boolean;
    const key = event.metadata.uid;
    // Only animate events if they're at the start of the list (first 6) and we haven't seen them before.
    if (!seen.has(key) && index < 6) {
      seen.add(key);
      shouldAnimate = true;
    }

    useEffect(
      () =>
        // Don't memory-leak the seen set while streaming.
        () => {
          seen.delete(key);
        },
      [key],
    );

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
        <EventComponent event={event} list={list} cache={measurementCache} index={index} />
      </div>
    );
  },
);
SysEvent.displayName = 'SysEvent';

const arePropsEqual = (prev: SysEventProps, next: SysEventProps) => {
  if (prev.event.lastTimestamp !== next.event.lastTimestamp) {
    // Timestamps can be modified because events can be combined.
    return false;
  }
  return _.isEqual(prev.style, next.style);
};

const MemoizedSysEvent = memo(SysEvent, arePropsEqual);

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
          <MemoizedSysEvent
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

type SysEventProps = {
  EventComponent: ComponentType<EventComponentProps>;
  event: EventKind;
  style: CSSProperties;
  index: number;
  className?: string;
  list: VirtualList;
};
