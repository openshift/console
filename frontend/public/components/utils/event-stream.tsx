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

import { EventModel } from '../../models';
import { WSFactory } from '../../module/ws-factory';
import { watchURL, EventKind, EventInvolvedObject } from '../../module/k8s';
import { inject } from './';

// Keep track of seen events so we only animate new ones.
const seen = new Set();
const timeout = {enter: 150};

const measurementCache = new CellMeasurerCache({
  fixedWidth: true,
  minHeight: 109, /* height of event with a one-line event message on desktop */
});

export const maxMessages = 500;
const flushInterval = 500;

// Predicate function to filter by event "category" (info, error, or all)
const categoryFilter = (category: string = 'all', {reason}: EventKind): boolean => {
  if (category === 'all') {
    return true;
  }
  const errorSubstrings = ['error', 'failed', 'unhealthy', 'nodenotready'];
  const isError = reason && errorSubstrings.find(substring => reason.toLowerCase().includes(substring));
  return category === 'error' ? !!isError : !isError;
};

const kindFilter = (kind: string = 'all', {involvedObject}: EventKind): boolean => kind === 'all' || involvedObject.kind === kind;

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
        {status => <div className={`slide-${status}`}><EventComponent isError={categoryFilter('error', event)} event={event} /></div>}
      </CSSTransition>
    </div>;
  }
}

export class EventStream extends React.Component<EventStreamProps, EventStreamState> {
  private messages: {[uid: string]: EventKind};
  private ws;

  constructor(props) {
    super(props);
    this.messages = {};
    this.state = {
      sortedMessages: [],
      filteredEvents: [],
      error: false,
      loading: true,
      oldestTimestamp: new Date(),
      filter: props.filter,
      kind: props.kind,
      category: props.category,
      textFilter: props.textFilter,
    };
  }

  wsInit(ns: string) {
    const params = {
      ns,
      fieldSelector: this.props.fieldSelector,
    };

    this.ws = new WSFactory(`${ns || 'all'}-sysevents`, {
      host: 'auto',
      reconnect: true,
      path: watchURL(EventModel, params),
      jsonParse: true,
      bufferFlushInterval: flushInterval,
      bufferMax: maxMessages,
    })
      .onbulkmessage(events => {
        events.forEach(({object, type}) => {
          const uid = object.metadata.uid;

          switch (type) {
            case 'ADDED':
            case 'MODIFIED':
              if (this.messages[uid] && this.messages[uid].count > object.count) {
                // We already have a more recent version of this message stored, so skip this one
                return;
              }
              this.messages[uid] = object;
              break;
            case 'DELETED':
              delete this.messages[uid];
              break;
            default:
              // eslint-disable-next-line no-console
              console.error(`UNHANDLED EVENT: ${type}`);
              return;
          }
        });
        this.flushMessages();
      })
      .onopen(() => {
        this.messages = {};
        this.setState({error: false, loading: false, sortedMessages: [], filteredEvents: []});
      })
      .onclose(evt => {
        if (evt && evt.wasClean === false) {
          this.setState({error: evt.reason || 'Connection did not close cleanly.'});
        }
        this.messages = {};
        this.setState({sortedMessages: [], filteredEvents: []});
      })
      .onerror(() => {
        this.messages = {};
        this.setState({error: true, sortedMessages: [], filteredEvents: []});
      });
  }

  componentDidMount() {
    this.wsInit(this.props.namespace);
  }

  componentWillUnmount() {
    this.ws && this.ws.destroy();
  }

  static filterEvents(messages: EventKind[], {kind, category, filter, textFilter}: EventStreamProps) {
    // Don't use `fuzzy` because it results in some surprising matches in long event messages.
    // Instead perform an exact substring match on each word in the text filter.
    const words = _.uniq(_.toLower(textFilter).match(/\S+/g)).sort((a, b) => {
      // Sort the longest words first.
      return b.length - a.length;
    });

    const textMatches = (obj) => {
      if (_.isEmpty(words)) {
        return true;
      }
      const name = _.get(obj, 'involvedObject.name', '');
      const message = _.toLower(obj.message);
      return _.every(words, word => name.indexOf(word) !== -1 || message.indexOf(word) !== -1);
    };

    const f = (obj) => {
      if (category && !categoryFilter(category, obj)) {
        return false;
      }
      if (kind && !kindFilter(kind, obj)) {
        return false;
      }
      if (filter && !_.isMatch(obj.involvedObject, filter)) {
        return false;
      }
      if (!textMatches(obj)) {
        return false;
      }
      return true;
    };

    return _.filter(messages, f);
  }

  static getDerivedStateFromProps(nextProps: EventStreamProps, prevState: EventStreamState) {
    const {filter, kind, category, textFilter} = prevState;

    if (_.isEqual(filter, nextProps.filter)
      && kind === nextProps.kind
      && category === nextProps.category
      && textFilter === nextProps.textFilter) {
      return {};
    }

    return {
      // update the filteredEvents
      filteredEvents: EventStream.filterEvents(prevState.sortedMessages, nextProps),
      // we need these for bookkeeping because getDerivedStateFromProps doesn't get prevProps
      textFilter: nextProps.textFilter,
      kind: nextProps.kind,
      category: nextProps.category,
      filter: nextProps.filter,
    };
  }

  componentDidUpdate(prevProps: EventStreamProps) {
    // If the namespace has changed, created a new WebSocket with the new namespace
    if (prevProps.namespace !== this.props.namespace) {
      this.ws && this.ws.destroy();
      this.wsInit(this.props.namespace);
    }
    if (prevProps.active !== this.props.active && this.ws) {
      this.props.active ? this.ws.unpause() : this.ws.pause();
    }
  }

  // Messages can come in extremely fast when the buffer flushes.
  // Instead of calling setState() on every single message, let onmessage()
  // update an instance variable, and throttle the actual UI update (see constructor)
  flushMessages() {
    // In addition to sorting by timestamp, secondarily sort by name so that the order is consistent when events have
    // the same timestamp
    const sorted = _.orderBy(this.messages, ['lastTimestamp', 'name'], ['desc', 'asc']);
    const oldestTimestamp = _.min([this.state.oldestTimestamp, new Date(_.last(sorted).lastTimestamp)]);
    sorted.splice(maxMessages);
    this.setState({
      oldestTimestamp,
      sortedMessages: sorted,
      filteredEvents: EventStream.filterEvents(sorted, this.props),
    });

    // Shrink this.messages back to maxMessages messages, to stop it growing indefinitely
    this.messages = _.keyBy(sorted, 'metadata.uid');
  }

  render() {
    const allCount = this.state.sortedMessages.length;
    const noEvents = allCount === 0 && this.ws && this.ws.bufferSize() === 0;
    const noMatches = allCount > 0 && this.state.filteredEvents.length === 0;
    return inject(this.props.children, {
      ..._.pick(this.state, ['filteredEvents', 'sortedMessages', 'oldestTimestamp', 'loading', 'error']),
      noMatches,
      noEvents,
    });
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
        </AutoSizer> }
    </WindowScroller>;
  }
}

type EventStreamListProps = {
  scrollableElementId?: string;
  events: EventKind[];
  EventComponent: React.ComponentType<EventComponentProps>;
}

export type EventStreamChildProps = {
  filteredEvents: EventKind[];
  oldestTimestamp: Date;
  sortedMessages: EventKind[];
  loading: boolean;
  error: boolean | string;
  noEvents: boolean;
  noMatches: boolean;
}

export type EventStreamProps = {
  category?: string;
  filter?: Partial<EventInvolvedObject>;
  kind?: string;
  namespace?: string;
  textFilter?: string;
  fieldSelector?: string;
  active?: boolean;
}

type EventStreamState = {
  sortedMessages: EventKind[];
  filteredEvents: EventKind[];
  error: boolean | string;
  loading: boolean;
  oldestTimestamp: Date;
  filter: Partial<EventInvolvedObject>;
  kind: string;
  category: string;
  textFilter: string;
}

export type EventComponentProps = {
  event: EventKind;
  isError: boolean;
}

type SysEventProps = {
  EventComponent: React.ComponentType<EventComponentProps>;
  event: EventKind;
  onLoad: () => void;
  onEntered: () => void;
  style: React.CSSProperties;
  index: number;
}
