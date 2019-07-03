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

import { EventKind } from '../../module/k8s';

// Keep track of seen events so we only animate new ones.
const seen = new Set();
const timeout = {enter: 150};

const measurementCache = new CellMeasurerCache({
  fixedWidth: true,
  minHeight: 109, /* height of event with a one-line event message on desktop */
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
    const { EventComponent, index, style, event} = this.props;

    let shouldAnimate: boolean;
    const key = event.metadata.uid;
    // Only animate events if they're at the start of the list (first 6) and we haven't seen them before.
    if (!seen.has(key) && index < 6) {
      seen.add(key);
      shouldAnimate = true;
    }

    return <div className="co-sysevent--transition" style={style}>
      <CSSTransition mountOnEnter={true} appear={shouldAnimate} in exit={false} timeout={timeout} classNames="slide">
        {status => <div className={`slide-${status}`}><EventComponent event={event} /></div>}
      </CSSTransition>
    </div>;
  }
}

export class EventStreamList extends React.Component<EventStreamListProps> {
  private rowRenderer;
  private list: VirtualList;

  constructor(props: EventStreamListProps) {
    super(props);
    this.rowRenderer = (events, index, style, key, parent) => (
      <CellMeasurer
        cache={measurementCache}
        columnIndex={0}
        key={key}
        rowIndex={index}
        parent={parent}>
        {({ measure }) =>
          <SysEvent event={events[index]} EventComponent={props.EventComponent} onLoad={measure} onEntered={print} key={key} style={style} index={index} />
        }
      </CellMeasurer>
    );
  }

  componentDidUpdate(prevProps: EventStreamListProps) {
    if (prevProps.events !== this.props.events) {
      this.onResize();
      if (this.list) {
        this.list.recomputeRowHeights();
      }
    }
  }

  onResize() {
    measurementCache.clearAll();
  }

  /* Default `height` to 0 to avoid console errors from https://github.com/bvaughn/react-virtualized/issues/1158 */
  render() {
    const { events, scrollableElementId = 'content-scrollable'} = this.props;
    return events.length > 0 &&
    <WindowScroller scrollElement={document.getElementById(scrollableElementId)}>
      {({height, isScrolling, registerChild, onChildScroll, scrollTop}) =>
        <AutoSizer disableHeight onResize={this.onResize}>
          {({width}) => <div ref={registerChild}>
            <VirtualList
              autoHeight
              data={events}
              deferredMeasurementCache={measurementCache}
              height={height || 0}
              isScrolling={isScrolling}
              onScroll={onChildScroll}
              ref={virtualList => this.list = virtualList}
              rowCount={events.length}
              rowHeight={measurementCache.rowHeight}
              rowRenderer={({index, style, key, parent}) => this.rowRenderer(events, index, style, key, parent)}
              scrollTop={scrollTop}
              tabIndex={null}
              width={width}
            />
          </div>}
        </AutoSizer>}
    </WindowScroller>;
  }
}

type EventStreamListProps = {
  scrollableElementId?: string;
  events: EventKind[];
  EventComponent: React.ComponentType<EventComponentProps>;
}

export type EventComponentProps = {
  event: EventKind;
}

type SysEventProps = {
  EventComponent: React.ComponentType<EventComponentProps>;
  event: EventKind;
  onLoad: () => void;
  onEntered: () => void;
  style: React.CSSProperties;
  index: number;
}
