import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import * as PropTypes from 'prop-types';
import { CSSTransition } from 'react-transition-group';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  AutoSizer,
  List as VirtualList,
  WindowScroller,
  CellMeasurerCache,
  CellMeasurer,
} from 'react-virtualized';

import { namespaceProptype } from '../propTypes';
import { ResourceListDropdown } from './resource-dropdown';
import { SafetyFirst } from './safety-first';
import { TextFilter } from './factory';
import { withStartGuide } from './start-guide';
import { NodeModel } from '../models';
import { connectToFlags, FLAGS } from '../features';
import {
  Box,
  Dropdown,
  Firehose,
  Loading,
  PageHeading,
  pluralize,
  ResourceLink,
  resourcePathFromModel,
  Timestamp,
  TogglePlay,
} from './utils';

const maxMessages = 500;

// Predicate function to filter by event "category" (info, error, or all)
const categoryFilter = (category, {reason}) => {
  if (category === 'all') {
    return true;
  }
  const errorSubstrings = ['error', 'failed', 'unhealthy', 'nodenotready'];
  const isError = reason && errorSubstrings.find(substring => reason.toLowerCase().includes(substring));
  return category === 'error' ? isError : !isError;
};

const kindFilter = (kind, {involvedObject}) => {
  return kind === 'all' || involvedObject.kind === kind;
};

const Inner = connectToFlags(FLAGS.CAN_LIST_NODE)(class Inner extends React.PureComponent {
  render() {
    const {klass, status, tooltipMsg, obj, lastTimestamp, firstTimestamp, message, source, count, flags} = this.props;

    return <div className={`${klass} slide-${status}`}>
      <div className="co-sysevent__icon-box">
        <i className="co-sysevent-icon" title={tooltipMsg} />
        <div className="co-sysevent__icon-line"></div>
      </div>
      <div className="co-sysevent__box">
        <div className="co-sysevent__header">
          <div className="co-sysevent__subheader">
            <ResourceLink
              className="co-sysevent__resourcelink"
              kind={obj.kind}
              namespace={obj.namespace}
              name={obj.name}
              title={obj.uid}
            />
            {obj.namespace && <ResourceLink
              className="co-sysevent__resourcelink hidden-xs"
              kind="Namespace"
              name={obj.namespace}
            />}
            <Timestamp className="co-sysevent__timestamp" timestamp={lastTimestamp} />
          </div>
          <div className="co-sysevent__details">
            <small className="co-sysevent__source">
              Generated from <span>{source.component}</span>
              {source.component === 'kubelet' && <span> on {flags[FLAGS.CAN_LIST_NODE]
                ? <Link to={resourcePathFromModel(NodeModel, source.host)}>{source.host}</Link>
                : <React.Fragment>{source.host}</React.Fragment>}
              </span>}
            </small>
            {count > 1 && <small className="co-sysevent__count text-secondary">
              {count} times in the last <Timestamp timestamp={firstTimestamp} simple={true} omitSuffix={true} />
            </small>}
          </div>
        </div>

        <div className="co-sysevent__message">
          {message}
        </div>
      </div>
    </div>;
  }
});

// Keep track of seen events so we only animate new ones.
const seen = new Set();
const timeout = {enter: 150};

class SysEvent extends React.Component {
  shouldComponentUpdate(nextProps) {
    if (this.props.lastTimestamp !== nextProps.lastTimestamp) {
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
    seen.delete(this.props.metadata.uid);
  }

  render() {
    const { index, style, reason, message, source, metadata, firstTimestamp, lastTimestamp, count, involvedObject: obj} = this.props;
    const klass = classNames('co-sysevent', {'co-sysevent--error': categoryFilter('error', this.props)});
    const tooltipMsg = `${reason} (${obj.kind})`;

    let shouldAnimate;
    const key = metadata.uid;
    // Only animate events if they're at the start of the list (first 6) and we haven't seen them before.
    if (!seen.has(key) && index < 6) {
      seen.add(key);
      shouldAnimate = true;
    }

    return <div className="co-sysevent--transition" style={style}>
      <CSSTransition mountOnEnter={true} appear={shouldAnimate} in exit={false} timeout={timeout} classNames="slide">
        {status => <Inner klass={klass} status={status} tooltipMsg={tooltipMsg} obj={obj} firstTimestamp={firstTimestamp} lastTimestamp={lastTimestamp} count={count} message={message} source={source} width={style.width} />}
      </CSSTransition>
    </div>;
  }
}

const categories = {all: 'All Categories', info: 'Info', error: 'Error'};

export class EventsList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      category: 'all',
      kind: 'all',
      textFilter: '',
    };
  }

  render() {
    const { category, kind, textFilter } = this.state;
    const { autoFocus=true, mock } = this.props;

    return <React.Fragment>
      <div className="co-m-pane__filter-bar">
        <div className="co-m-pane__filter-bar-group">
          <ResourceListDropdown
            className="btn-group"
            onChange={v => this.setState({kind: v})}
            selected={kind}
            showAll
            title="All Types"
          />
          <Dropdown
            className="btn-group"
            items={categories}
            onChange={v => this.setState({category: v})}
            title="All Categories"
          />
        </div>
        <div className="co-m-pane__filter-bar-group co-m-pane__filter-bar-group--filter">
          <TextFilter
            autoFocus={autoFocus}
            label="Events by name or message"
            onChange={e => this.setState({textFilter: e.target.value || ''})}
          />
        </div>
      </div>
      <EventStream
        {...this.props}
        category={category}
        kind={kind}
        mock={mock}
        textFilter={textFilter}
      />
    </React.Fragment>;
  }
}

export const EventStreamPage = withStartGuide(({noProjectsAvailable, ...rest}) =>
  <React.Fragment>
    <Helmet>
      <title>Events</title>
    </Helmet>
    <PageHeading title="Events" />
    <EventsList {...rest} autoFocus={!noProjectsAvailable} mock={noProjectsAvailable} />
  </React.Fragment>
);

const measurementCache = new CellMeasurerCache({
  fixedWidth: true,
  minHeight: 109, /* height of event with a one-line event message on desktop */
});

class EventStream_ extends SafetyFirst {
  constructor(props) {
    super(props);
    this.messages = {};
    this.unprocessedMessages = {};
    this.state = {
      active: true,
      error: null,
      filteredEvents: [],
      loadedEventList: false,
      loading: true,
      oldestTimestamp: new Date(),
      sortedMessages: [],
    };
    this.toggleStream = this.toggleStream_.bind(this);
    this.rowRenderer = function rowRenderer({index, style, key, parent}) {
      const event = this.state.filteredEvents[index];
      return <CellMeasurer
        cache={measurementCache}
        columnIndex={0}
        key={key}
        rowIndex={index}
        parent={parent}>
        {({ measure }) =>
          <SysEvent {...event} onLoad={measure} onEntered={print} src={event} key={key} style={style} index={index} />
        }
      </CellMeasurer>;
    }.bind(this);
  }

  toggleStream_() {
    this.setState({active: !this.state.active});
  }

  static filterEvents(messages, {kind, category, filter, textFilter}) {
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

  componentDidUpdate(prevProps) {
    if (prevProps.namespace !== this.props.namespace) {
      this.messages = {};
      this.unprocessedMessages = {};
      this.setState({
        filteredEvents: [],
        loadedEventList: false,
        loading: true,
        sortedMessages: [],
      });
    }
    if (prevProps.obj.data.loadError !== this.props.obj.data.loadError) {
      this.setState({error: this.props.data.loadError.message});
    }
    if (prevProps.obj.data.kind !== this.props.obj.data.kind) {
      if (this.state.active) {
        if (!_.isEmpty(this.unprocessedMessages)) {
          this.messages = Object.assign(this.messages, this.unprocessedMessages);
          this.unprocessedMessages = {};
        }
        if (this.props.obj.data.kind === 'Event') {
          const uid = this.props.obj.data.metadata.uid;
          if (this.messages[uid] && this.messages[uid].count > this.props.obj.data.count) {
            // We already have a more recent version of this message stored, so skip this one
            return;
          }
          this.messages[uid] = this.props.obj.data;
          this.flushMessages();
          this.resizeEvents();
        }
        if (this.props.obj.data.kind === 'EventList' && !this.state.loadedEventList) {
          if (this.props.obj.data.items.length === 0) {
            this.setState({
              filteredMessages: [],
              loadedEventList: true,
              loading: false,
              sortedMessages: [],
            });
          } else {
            // map through events and remove duplicates
            for (let i = 0; i < this.props.obj.data.items.length; i++) {
              const uid = this.props.obj.data.items[i].metadata.uid;
              if (this.messages[uid] && this.messages[uid].count > this.props.obj.data.items[i].count) {
                // We already have a more recent version of this message stored, so skip this one
                return;
              }
              this.messages[uid] = this.props.obj.data.items[i];
            }
            this.flushMessages();
            this.resizeEvents();
            this.setState({loadedEventList: true, loading: false});
          }
        }
      } else {
        if (this.props.obj.data.kind === 'Event') {
          const uid = this.props.obj.data.metadata.uid;
          if (this.unprocessedMessages[uid] && this.unprocessedMessages[uid].count > this.props.obj.data.count) {
            // We already have a more recent version of this message stored, so skip this one
            return;
          }
          this.unprocessedMessages[uid] = this.props.obj.data;
        }
      }
    }
    if ((prevProps.textFilter !== this.props.textFilter) || (prevProps.kind !== this.props.kind) || (prevProps.category !== this.props.category)) {
      this.resizeEvents();
    }
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const {filter, kind, category, textFilter, loading} = prevState;

    if (_.isEqual(filter, nextProps.filter)
      && kind === nextProps.kind
      && category === nextProps.category
      && textFilter === nextProps.textFilter) {
      return {};
    }

    return {
      active: !nextProps.mock,
      loading: !nextProps.mock && loading,
      // update the filteredEvents
      filteredEvents: EventStream_.filterEvents(prevState.sortedMessages, nextProps),
      // we need these for bookkeeping because getDerivedStateFromProps doesn't get prevProps
      textFilter: nextProps.textFilter,
      kind: nextProps.kind,
      category: nextProps.category,
      filter: nextProps.filter,
    };
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
      filteredEvents: EventStream_.filterEvents(sorted, this.props),
    });

    // Shrink this.messages back to maxMessages messages, to stop it growing indefinitely
    this.messages = _.keyBy(sorted, 'metadata.uid');
  }

  onResize() {
    measurementCache.clearAll();
  }

  resizeEvents() {
    measurementCache.clearAll();
    if (this.list) {
      this.list.recomputeRowHeights();
    }
  }

  render() {
    let sysEventStatus, statusBtnTxt;
    const { mock, resourceEventStream } = this.props;
    const {active, error, loading, filteredEvents, sortedMessages} = this.state;

    const count = filteredEvents.length;
    const allCount = sortedMessages.length;
    const noEvents = allCount === 0;
    const noMatches = allCount > 0 && count === 0;

    if (noEvents || mock || (noMatches && resourceEventStream)) {
      sysEventStatus = (
        <Box className="co-sysevent-stream__status-box-empty">
          <div className="text-center cos-status-box__detail">
          No events in the past hour
          </div>
        </Box>
      );
    }
    if (noMatches && !resourceEventStream) {
      sysEventStatus = (
        <Box className="co-sysevent-stream__status-box-empty">
          <div className="cos-status-box__title">No matching events</div>
          <div className="text-center cos-status-box__detail">
            {allCount}{allCount >= maxMessages && '+'} events exist, but none match the current filter
          </div>
        </Box>
      );
    }

    if (error) {
      statusBtnTxt = <span className="co-sysevent-stream__connection-error">Error connecting to event stream{_.isString(this.props.obj.data.loadError.message) && `: ${this.props.obj.data.loadError.stack}`}</span>;
      sysEventStatus = (
        <Box>
          <div className="cos-status-box__title cos-error-title">Error loading events</div>
          <div className="cos-status-box__detail text-center">An error occurred during event retrieval. Attempting to reconnect...</div>
        </Box>
      );
    } else if (loading) {
      statusBtnTxt = <span>Loading events...</span>;
      sysEventStatus = <Loading />;
    } else if (active) {
      statusBtnTxt = <span>Streaming events...</span>;
    } else {
      statusBtnTxt = <span>Event stream is paused.</span>;
    }

    const klass = classNames('co-sysevent-stream__timeline', {
      'co-sysevent-stream__timeline--empty': !allCount || !count,
    });
    const messageCount = count < maxMessages ? `Showing ${pluralize(count, 'event')}` : `Showing ${count} of ${allCount}+ events`;

    return <div className="co-m-pane__body co-m-pane__body--alt">
      <div className="co-sysevent-stream">
        <div className="co-sysevent-stream__status">
          <div className="co-sysevent-stream__timeline__btn-text">
            { statusBtnTxt }
          </div>
          <div className="co-sysevent-stream__totals text-secondary">
            { messageCount }
          </div>
        </div>

        <div className={klass}>
          <TogglePlay active={active} onClick={this.toggleStream} className="co-sysevent-stream__timeline__btn" />
          <div className="co-sysevent-stream__timeline__end-message">
          There are no events before <Timestamp timestamp={this.state.oldestTimestamp} />
          </div>
        </div>
        { /* Default `height` to 0 to avoid console errors from https://github.com/bvaughn/react-virtualized/issues/1158 */}
        { count > 0 &&
            <WindowScroller scrollElement={document.getElementById('content-scrollable')}>
              {({height, isScrolling, registerChild, onChildScroll, scrollTop}) =>
                <AutoSizer disableHeight onResize={this.onResize}>
                  {({width}) => <div ref={registerChild}>
                    <VirtualList
                      autoHeight
                      data={filteredEvents}
                      deferredMeasurementCache={measurementCache}
                      height={height || 0}
                      isScrolling={isScrolling}
                      onScroll={onChildScroll}
                      ref={virtualList => this.list = virtualList}
                      rowCount={count}
                      rowHeight={measurementCache.rowHeight}
                      rowRenderer={this.rowRenderer}
                      scrollTop={scrollTop}
                      tabIndex={null}
                      width={width}
                    />
                  </div>}
                </AutoSizer> }
            </WindowScroller>
        }
        { sysEventStatus }
      </div>
    </div>;
  }
}

class EventStream extends React.Component {
  render() {
    return <Firehose resources={[{
      kind: 'Event',
      namespace: this.props.namespace,
      fieldSelector: this.props.fieldSelector,
      prop: 'obj',
    }]}>
      <EventStream_ {...this.props} />
    </Firehose>;
  }
}

EventStream.defaultProps = {
  category: 'all',
  kind: 'all',
  mock: false,
};

EventStream.propTypes = {
  category: PropTypes.string,
  filter: PropTypes.object,
  kind: PropTypes.string.isRequired,
  mock: PropTypes.bool,
  namespace: namespaceProptype,
  showTitle: PropTypes.bool,
  textFilter: PropTypes.string,
};


export const ResourceEventStream = ({obj: {kind, metadata: {name, namespace}}}) => <EventStream filter={{name, kind}} namespace={namespace} resourceEventStream />;
