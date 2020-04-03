import * as React from 'react';
import * as _ from 'lodash-es';
import {
  AutoSizer,
  List as VirtualList,
  WindowScroller,
  CellMeasurer,
  CellMeasurerCache,
} from 'react-virtualized';
import { CSSTransition } from 'react-transition-group';
import classNames from 'classnames';

import { EventKind } from '../../module/k8s';
import { WithScrollContainer } from './dom-utils';

// Keep track of seen events so we only animate new ones.
const seen = new Set();
const timeout = { enter: 150 };

const measurementCache = new CellMeasurerCache({
  fixedWidth: true,
});

class SysEvent extends React.Component<SysEventProps> {
  shouldComponentUpdate(nextProps: SysEventProps) {
    if (this.props.event.lastTimestamp !== nextProps.event.lastTimestamp) {
      // Timestamps can be modified because events can be combined.
      return true;
    }
    if (_.isEqual(this.props.style, nextProps.style)) {
      return false;
    }
    return true;
  }

  componentWillUnmount() {
    // TODO (kans): this is not correct, but don't memory leak :-/
    seen.delete(this.props.event.metadata.uid);
  }

  render() {
    const { EventComponent, index, style, event, className } = this.props;

    let shouldAnimate: boolean;
    const key = event.metadata.uid;
    // Only animate events if they're at the start of the list (first 6) and we haven't seen them before.
    if (!seen.has(key) && index < 6) {
      seen.add(key);
      shouldAnimate = true;
    }

    return (
      <div className={classNames('co-sysevent--transition', className)} style={style} role="row">
        <CSSTransition
          mountOnEnter={true}
          appear={shouldAnimate}
          in
          exit={false}
          timeout={timeout}
          classNames="slide"
        >
          {(status) => (
            <div className={`slide-${status}`}>
              <EventComponent event={event} />
            </div>
          )}
        </CSSTransition>
      </div>
    );
  }
}

export const EventStreamList: React.FC<EventStreamListProps> = ({
  events,
  className,
  EventComponent,
}) => {
  const [list, setList] = React.useState(null);
  const onResize = React.useCallback(() => measurementCache.clearAll(), []);
  React.useEffect(() => {
    onResize();
    list?.recomputeRowHeights();
  }, [list, events, onResize]);
  const rowRenderer = React.useCallback(
    ({ index, style, key, parent }) => (
      <CellMeasurer
        cache={measurementCache}
        columnIndex={0}
        key={key}
        rowIndex={index}
        parent={parent}
      >
        {({ measure }) => (
          <SysEvent
            className={className}
            event={events[index]}
            EventComponent={EventComponent}
            onLoad={measure}
            onEntered={print}
            key={key}
            style={style}
            index={index}
          />
        )}
      </CellMeasurer>
    ),
    [events, className, EventComponent],
  );

  const renderVirtualizedTable = (scrollContainer) => (
    <WindowScroller scrollElement={scrollContainer}>
      {({ height, isScrolling, registerChild, onChildScroll, scrollTop }) => (
        <AutoSizer disableHeight onResize={onResize}>
          {({ width }) => (
            <div ref={registerChild}>
              <VirtualList
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
  EventComponent: React.ComponentType<EventComponentProps>;
  className?: string;
};

export type EventComponentProps = {
  event: EventKind;
};

type SysEventProps = {
  EventComponent: React.ComponentType<EventComponentProps>;
  event: EventKind;
  onLoad: () => void;
  onEntered: () => void;
  style: React.CSSProperties;
  index: number;
  className?: string;
};
