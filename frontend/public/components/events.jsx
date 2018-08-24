import * as _ from 'lodash-es';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { CSSTransition } from 'react-transition-group';
import { Helmet } from 'react-helmet';
import * as classNames from 'classnames';
import * as PropTypes from 'prop-types';
import { AutoSizer, List as VirtualList, WindowScroller } from 'react-virtualized';

import { namespaceProptype } from '../propTypes';
import { watchURL } from '../module/k8s';
import { EventModel, NodeModel } from '../models';
import { SafetyFirst } from './safety-first';
import { TextFilter } from './factory';
import { Dropdown, ResourceLink, Box, Loading, NavTitle, Timestamp, TogglePlay, pluralize, resourcePathFromModel } from './utils';
import { WSFactory } from '../module/ws-factory';
import { ResourceListDropdown } from './resource-dropdown';
import { connectToFlags, FLAGS, flagPending } from '../features';
import { OpenShiftGettingStarted } from './start-guide';

const maxMessages = 500;
const flushInterval = 500;

// Predicate function to filter by event "category" (info, error, or all)
const categoryFilter = (category, {reason}) => {
  if (category === 'all') {
    return true;
  }
  const errorSubstrings = ['error', 'failed', 'unhealthy', 'nodenotready'];
  const isError = errorSubstrings.find(substring => reason.toLowerCase().includes(substring));
  return category === 'error' ? isError : !isError;
};

const kindFilter = (kind, {involvedObject}) => {
  return kind === 'all' || involvedObject.kind === kind;
};

const Inner = connectToFlags(FLAGS.CAN_LIST_NODE)(class Inner extends React.PureComponent {
  render () {
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
            <Timestamp timestamp={lastTimestamp} />
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

        <div className="co-sysevent__message" title={_.trim(message)}>
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
  shouldComponentUpdate (nextProps) {
    if (this.props.lastTimestamp !== nextProps.lastTimestamp) {
      // Timestamps can be modified because events can be combined.
      return true;
    }
    if (_.isEqual(this.props.style, nextProps.style)) {
      return false;
    }
    return true;
  }

  componentWillUnmount () {
    // TODO (kans): this is not correct, but don't memory leak :-/
    seen.delete(this.props.metadata.uid);
  }

  render () {
    const { index, style, reason, message, source, metadata, firstTimestamp, lastTimestamp, count, involvedObject: obj} = this.props;
    const klass = classNames('co-sysevent', {'co-sysevent--error': categoryFilter('error', this.props)});
    const tooltipMsg = `${reason} (${obj.kind.toLowerCase()})`;

    let shouldAnimate;
    const key = metadata.uid;
    // Only animate events if they're at the start of the list (first 6) and we haven't seen them before.
    if (!seen.has(key) && index < 6) {
      seen.add(key);
      shouldAnimate = true;
    }

    return <div style={style}>
      <CSSTransition mountOnEnter={true} appear={shouldAnimate} in exit={false} timeout={timeout} classNames="slide">
        {status => <Inner klass={klass} status={status} tooltipMsg={tooltipMsg} obj={obj} firstTimestamp={firstTimestamp} lastTimestamp={lastTimestamp} count={count} message={message} source={source} width={style.width} />}
      </CSSTransition>
    </div>;
  }
}

const categories = {all: 'All Categories', info: 'Info', error: 'Error'};

class EventsStreamPage_ extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      category: 'all',
      kind: 'all',
      textFilter: '',
    };
  }

  render () {
    const { category, kind, textFilter } = this.state;
    const { flags, showTitle=true, autoFocus=true } = this.props;
    if (flagPending(flags.OPENSHIFT) || flagPending(flags.PROJECTS_AVAILABLE)) {
      return null;
    }
    const showGettingStarted = flags.OPENSHIFT && !flags.PROJECTS_AVAILABLE;

    return <React.Fragment>
      { showGettingStarted && showTitle && <OpenShiftGettingStarted /> }
      <div className={classNames({'co-disabled': showGettingStarted })}>
        { showTitle && <Helmet>
          <title>Events</title>
        </Helmet> }
        { showTitle && <NavTitle title="Events" /> }
        <div className="co-m-pane__filter-bar">
          <div className="co-m-pane__filter-bar-group">
            <ResourceListDropdown title="All Types" className="btn-group" onChange={v => this.setState({kind: v})} showAll selected={kind} />
            <Dropdown title="All Categories" className="btn-group" items={categories} onChange={v => this.setState({category: v})} />
          </div>
          <div className="co-m-pane__filter-bar-group co-m-pane__filter-bar-group--filter">
            <TextFilter label="Events by name or message" onChange={e => this.setState({textFilter: e.target.value || ''})} autoFocus={autoFocus} />
          </div>
        </div>
        <EventStream {...this.props} category={category} kind={kind} textFilter={textFilter} fake={showGettingStarted} />
      </div>
    </React.Fragment>;
  }
}

export const EventStreamPage = connectToFlags(FLAGS.OPENSHIFT, FLAGS.PROJECTS_AVAILABLE)(EventsStreamPage_);

class EventStream extends SafetyFirst {
  constructor (props) {
    super(props);
    this.messages = {};
    this.state = {
      active: true,
      sortedMessages: [],
      filteredEvents: [],
      error: null,
      loading: true,
      oldestTimestamp: new Date(),
    };
    this.toggleStream = this.toggleStream_.bind(this);
    this.rowRenderer = function rowRenderer ({index, style, key}) {
      const event = this.state.filteredEvents[index];
      return <SysEvent {...event} key={key} style={style} index={index} />;
    }.bind(this);
  }

  wsInit (ns) {
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

  componentDidMount () {
    super.componentDidMount();
    if (!this.props.fake) {
      this.wsInit(this.props.namespace);
    }
  }

  componentWillUnmount () {
    super.componentWillUnmount();
    this.ws && this.ws.destroy();
  }

  static filterEvents (messages, {kind, category, filter, textFilter}) {
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

  static getDerivedStateFromProps (nextProps, prevState) {
    const {filter, kind, category, textFilter, loading} = prevState;

    if (_.isEqual(filter, nextProps.filter)
      && kind === nextProps.kind
      && category === nextProps.category
      && textFilter === nextProps.textFilter) {
      return {};
    }

    return {
      active: !nextProps.fake,
      loading: !nextProps.fake && loading,
      // update the filteredEvents
      filteredEvents: EventStream.filterEvents(prevState.sortedMessages, nextProps),
      // we need these for bookkeeping because getDerivedStateFromProps doesn't get prevProps
      textFilter: nextProps.textFilter,
      kind: nextProps.kind,
      category: nextProps.category,
      filter: nextProps.filter,
    };
  }

  componentDidUpdate (prevProps) {
    // If the namespace has changed, created a new WebSocket with the new namespace
    if (prevProps.namespace !== this.props.namespace) {
      this.ws && this.ws.destroy();
      this.wsInit(this.props.namespace);
    }
  }

  // Messages can come in extremely fast when the buffer flushes.
  // Instead of calling setState() on every single message, let onmessage()
  // update an instance variable, and throttle the actual UI update (see constructor)
  flushMessages () {
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

  toggleStream_ () {
    this.setState({active: !this.state.active}, () => {
      if (this.state.active) {
        this.ws && this.ws.unpause();
      } else {
        this.ws && this.ws.pause();
      }
    });
  }

  render () {
    const { fake, resourceEventStream } = this.props;
    const {active, error, loading, filteredEvents, sortedMessages} = this.state;
    const count = filteredEvents.length;
    const allCount = sortedMessages.length;
    const noEvents = allCount === 0 && this.ws && this.ws.bufferSize() === 0;
    const noMatches = allCount > 0 && count === 0;
    let sysEventStatus, statusBtnTxt;

    if (noEvents || fake || (noMatches && resourceEventStream)) {
      sysEventStatus = (
        <Box className="co-sysevent-stream__status-box-empty">
          <div className="text-center cos-status-box__detail">
          No Events in the past hour
          </div>
        </Box>
      );
    }
    if (noMatches && !resourceEventStream) {
      sysEventStatus = (
        <Box className="co-sysevent-stream__status-box-empty">
          <div className="cos-status-box__title">No Matching Events</div>
          <div className="text-center cos-status-box__detail">
            {allCount}{allCount >= maxMessages && '+'} events exist, but none match the current filter
          </div>
        </Box>
      );
    }

    if (error) {
      statusBtnTxt = <span className="co-sysevent-stream__connection-error">Error connecting to event stream{_.isString(error) && `: ${error}`}</span>;
      sysEventStatus = (
        <Box>
          <div className="cos-status-box__title cos-error-title">Error Loading Events</div>
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
      'co-sysevent-stream__timeline--empty': !allCount || !count
    });
    const messageCount = count < maxMessages ? `Showing ${pluralize(count, 'event')}` : `Showing ${count} of ${allCount}+ events`;

    return <div className="co-m-pane__body">
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
        { count > 0 &&
            <WindowScroller>
              {({height, isScrolling, registerChild, onChildScroll, scrollTop}) =>
                <AutoSizer disableHeight>
                  {({width}) => <div ref={registerChild}>
                    <VirtualList
                      autoHeight
                      data={filteredEvents}
                      height={height}
                      isScrolling={isScrolling}
                      onScroll={onChildScroll}
                      rowRenderer={this.rowRenderer}
                      scrollTop={scrollTop}
                      width={width}
                      rowCount={count}
                      tabIndex={null}
                      /* Width goes up to 675 and then goes down to 416 when the mobile/desktop breakpoint kicks in. It keeps increasing from there. You have to pick a number that won't overlap both ranges multiple times unless you want to write a ton of media queries. */
                      rowHeight={width < 416 ? 140 : 110}
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

EventStream.defaultProps = {
  fake: false,
  kind: 'all',
  category: 'all',
};

EventStream.propTypes = {
  fake: PropTypes.bool,
  namespace: namespaceProptype,
  kind: PropTypes.string.isRequired,
  category: PropTypes.string,
  filter: PropTypes.object,
  textFilter: PropTypes.string,
  showTitle: PropTypes.bool,
};


export const ResourceEventStream = ({obj: {kind, metadata: {name, namespace}}}) => <EventStream filter={{name, kind}} namespace={namespace} resourceEventStream />;
