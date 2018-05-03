import * as _ from 'lodash-es';
import * as React from 'react';
import { CSSTransition } from 'react-transition-group';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import * as classNames from'classnames';
import * as PropTypes from 'prop-types';
import { AutoSizer, List as VirtualList, WindowScroller } from 'react-virtualized';

import { namespaceProptype } from '../propTypes';
import { k8sKinds, watchURL } from '../module/k8s';
import { SafetyFirst } from './safety-first';
import { Dropdown, ResourceLink, Box, Loading, NavTitle, Timestamp, TogglePlay, pluralize } from './utils';
import { WSFactory } from '../module/ws-factory';
import { ResourceListDropdown } from './resource-dropdown';

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

class Inner extends React.PureComponent {
  render () {
    const {klass, status, tooltipMsg, obj, lastTimestamp, message, source} = this.props;

    return <div className={`${klass} slide-${status}`}>
      <div className="co-sysevent__icon-box">
        <i className="co-sysevent-icon" title={tooltipMsg} />
        <div className="co-sysevent__icon-line"></div>
      </div>
      <div className="co-sysevent__main-box">
        <ResourceLink
          kind={obj.kind}
          namespace={obj.namespace}
          name={obj.name}
          title={obj.uid}
        />
        <div className="co-sysevent__main-message">{message}</div>
      </div>
      <div className="co-sysevent__meta-box">
        <div><Timestamp timestamp={lastTimestamp} /></div>
        <small className="co-sysevent__meta-source">
          Generated from <span>{source.component}</span>
          {source.component === 'kubelet' &&
            <span> on <Link to={`/k8s/cluster/nodes/${source.host}`}>{source.host}</Link></span>
          }
        </small>
      </div>
    </div>;
  }
}

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
    // TODO: this is not correct, but don't memory leak :-/
    seen.delete(this.props.metadata.uid);
  }

  render () {
    const { index, style, reason, message, source, metadata, lastTimestamp, involvedObject: obj} = this.props;
    const klass = classNames('co-sysevent', {'co-sysevent--error': categoryFilter('error', this.props)});
    const tooltipMsg = `${reason} (${obj.kind.toLowerCase()})`;

    // TODO: (kans)
    const s = Object.assign({}, style);
    delete s.width;
    s.right = 0;
    s.height = s.height - 20;

    let shouldAnimate;
    const key = metadata.uid;
    if (key in seen) {
      shouldAnimate = false;
    } else if (index < 6) {
      seen.add(key);
      shouldAnimate = true;
    }

    return <div style={s}>
      <CSSTransition mountOnEnter={true} appear={shouldAnimate} in exit={false} timeout={timeout} classNames="slide">
        {status => <Inner klass={klass} status={status} tooltipMsg={tooltipMsg} obj={obj} lastTimestamp={lastTimestamp} message={message} source={source} />}
      </CSSTransition>
    </div>;
  }
}

const categories = {all: 'All Categories', info: 'Info', error: 'Error'};

export class EventStreamPage extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      category: 'all',
      kind: 'all',
    };
  }

  render () {
    const {category, kind} = this.state;
    const { showTitle=true } = this.props;
    return <React.Fragment>
      { showTitle && <Helmet>
        <title>Events</title>
      </Helmet> }
      { showTitle && <NavTitle title="Events" /> }
      <div className="co-m-pane__heading">
        <div className="btn-group">
          <ResourceListDropdown title="All Types" className="btn-group" onChange={v => this.setState({kind: v})} showAll selected={kind} />
          <Dropdown title="All Categories" className="btn-group" items={categories} onChange={v => this.setState({category: v})} />
        </div>
      </div>
      <EventStream {...this.props} category={category} kind={kind} />
    </React.Fragment>;
  }
}

class EventStream extends SafetyFirst {
  constructor (props) {
    super(props);
    this.messages = {};
    this.state = {
      active: true,
      sortedMessages: [],
      filteredMessages: [],
      error: null,
      loading: true,
      oldestTimestamp: new Date(),
    };
    this.toggleStream = this.toggleStream_.bind(this);
    this.rowRenderer = function rowRenderer ({index, style, key}) {
      const event = this.state.filteredMessages[index];
      return <SysEvent {...event} key={key} style={style} index={index} />;
    }.bind(this);

    // TODO: (ggreer) add an onBufferFlush or other batch API to ws-factory.
    this.flushMessages = _.throttle(this.flushMessages_, 500);
  }

  wsInit (ns) {
    const params = {
      ns,
      fieldSelector: this.props.fieldSelector,
    };

    this.ws = new WSFactory(`${ns || 'all'}-sysevents`, {
      host: 'auto',
      reconnect: true,
      path: watchURL(k8sKinds.Event, params),
      jsonParse: true,
      bufferEnabled: true,
      bufferFlushInterval: flushInterval,
      bufferMax: maxMessages,
    })
      .onmessage(data => {
        const uid = data.object.metadata.uid;

        switch (data.type) {
          case 'ADDED':
          case 'MODIFIED':
            if (this.messages[uid] && this.messages[uid].count > data.object.count) {
              // We already have a more recent version of this message stored, so skip this one
              return;
            }
            this.messages[uid] = data.object;
            break;
          case 'DELETED':
            delete this.messages[uid];
            break;
          default:
            // eslint-disable-next-line no-console
            console.error(`UNHANDLED EVENT: ${data.type}`);
            return;
        }
        this.flushMessages();
      })
      .onopen(() => {
        this.setState({error: false, loading: false, sortedMessages: [], filteredMessages: []});
      })
      .onclose(evt => {
        if (evt && evt.wasClean === false) {
          this.setState({error: evt.reason || 'WebSocket closed uncleanly.'});
        }
        this.setState({sortedMessages: [], filteredMessages: []});
      })
      .onerror(() => {
        this.setState({error: true, sortedMessages: [], filteredMessages: []});
      });
  }

  componentDidMount () {
    super.componentDidMount();
    this.wsInit(this.props.namespace);
  }

  componentWillUnmount () {
    super.componentWillUnmount();
    this.ws.destroy();
  }

  static filterMessages (messages, {kind, category, filter}) {
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
      return true;
    };

    return _.filter(messages, f);
  }

  static getDerivedStateFromProps (nextProps, prevState) {
    const {filter, kind, category} = prevState;

    if (_.isEqual(filter, nextProps.filter) && kind === nextProps.kind && category === nextProps.category) {
      return {};
    }

    return {
      // update the filteredMessages
      filteredMessages: EventStream.filterMessages(prevState.sortedMessages, nextProps),
      // we need these for bookkeeping because getDerivedStateFromProps doesn't get prevProps
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
  flushMessages_ () {
    if (!_.isEmpty(this.messages)) {
      // In addition to sorting by timestamp, secondarily sort by name so that the order is consistent when events have
      // the same timestamp
      const sorted = _.orderBy(this.messages, ['lastTimestamp', 'name'], ['desc', 'asc']);
      const oldestTimestamp = _.min([this.state.oldestTimestamp, new Date(_.last(sorted).lastTimestamp)]);
      sorted.splice(maxMessages);
      this.setState({
        oldestTimestamp,
        sortedMessages: sorted,
        filteredMessages: EventStream.filterMessages(sorted, this.props),
      });

      // Shrink this.messages back to maxMessages messages, to stop it growing indefinitely
      this.messages = _.keyBy(sorted, 'metadata.uid');
    }
  }

  toggleStream_ () {
    this.setState({active: !this.state.active}, () => {
      if (this.state.active) {
        this.ws.unpause();
      } else {
        this.ws.pause();
      }
    });
  }

  render () {
    const {active, error, loading, filteredMessages, sortedMessages} = this.state;
    const count = filteredMessages.length;
    const allCount = sortedMessages.length;
    let sysEventStatus;

    if (allCount === 0 && this.ws && this.ws.bufferSize() === 0) {
      sysEventStatus = (
        <Box className="co-sysevent-stream__status-box-empty">
          <div className="text-center cos-status-box__detail">
          No Events in the past hour
          </div>
        </Box>
      );
    }
    if (allCount > 0 && count === 0) {
      sysEventStatus = (
        <Box className="co-sysevent-stream__status-box-empty">
          <div className="cos-status-box__title">No Matching Events</div>
          <div className="text-center cos-status-box__detail">
            {allCount}{allCount >= maxMessages && '+'} events exist, but none match the current filter
          </div>
        </Box>
      );
    }

    let statusBtnTxt;
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
          <div className="co-sysevent-stream__totals">
            { messageCount }
          </div>
        </div>

        <div className={klass}>
          <TogglePlay active={active} onClick={this.toggleStream} className="co-sysevent-stream__timeline__btn" />
          <div className="co-sysevent-stream__timeline__end-message">
          There are no events before <Timestamp timestamp={this.state.oldestTimestamp} />
          </div>
        </div>
        <WindowScroller>
          {({height, isScrolling, registerChild, onChildScroll, scrollTop}) =>
            <AutoSizer disableHeight>
              {({width}) => {
                this._mostRecentWidth = width;
                return <div ref={registerChild}>
                  <VirtualList
                    data={filteredMessages}
                    autoHeight
                    height={height}
                    isScrolling={isScrolling}
                    onScroll={onChildScroll}
                    rowRenderer={this.rowRenderer}
                    scrollTop={scrollTop}
                    width={width}
                    rowCount={count}
                    // TODO: set rowHeight based on media query
                    // @media screen and (min-width: 768px)...
                    rowHeight={135}
                  />
                </div>;
              }
              }
            </AutoSizer>
          }
        </WindowScroller>
        { sysEventStatus }
      </div>
    </div>;
  }
}

EventStream.defaultProps = {
  kind: 'all',
  category: 'all',
};

EventStream.propTypes = {
  namespace: namespaceProptype,
  kind: PropTypes.string.isRequired,
  category: PropTypes.string,
  filter: PropTypes.object,
  showTitle: PropTypes.bool,
};


export const ResourceEventStream = ({obj: {metadata: {name, namespace}}}) => <EventStream filter={{name}} namespace={namespace} />;
