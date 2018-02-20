import * as _ from 'lodash';
import * as React from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import * as classNames from'classnames';

import { k8sKinds, watchURL } from '../module/k8s';
import { SafetyFirst } from './safety-first';
import { Dropdown, ResourceLink, Box, kindObj, Loading, NavTitle, Timestamp, TogglePlay, pluralize } from './utils';
import { wsFactory } from '../module/ws-factory';

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
  return kind === 'all' || involvedObject.kind.toLowerCase() === kind;
};

class SysEvent extends React.PureComponent {
  render() {
    const klass = classNames('co-sysevent', {'co-sysevent--error': categoryFilter('error', this.props)});
    const obj = this.props.involvedObject;
    const tooltipMsg = `${this.props.reason} (${obj.kind.toLowerCase()})`;

    return (
      <div className={klass}>
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
          <div className="co-sysevent__main-message">{this.props.message}</div>
        </div>
        <div className="co-sysevent__meta-box">
          <div><Timestamp timestamp={this.props.lastTimestamp} /></div>
          <small className="co-sysevent__meta-source">
            Generated from <span>{this.props.source.component}</span>
            {this.props.source.component === 'kubelet' &&
              <span> on <Link to={`/k8s/cluster/nodes/${this.props.source.host}`}>{this.props.source.host}</Link></span>
            }
          </small>
        </div>
      </div>
    );
  }
}

const categories = {all: 'All Categories', info: 'Info', error: 'Error'};

const kinds = ['DaemonSet', 'Deployment', 'Ingress', 'Job', 'Node', 'Pod', 'ReplicaSet', 'ReplicationController'];

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
    const types = Object.assign({all: 'All Types'}, _.zipObject(kinds, _.map(kinds, k => kindObj(k).labelPlural)));
    return <div>
      { showTitle && <Helmet>
        <title>Events</title>
      </Helmet> }
      { showTitle && <NavTitle title="Events" /> }
      <div className="co-m-pane">
        <div className="co-m-pane__heading">
          <div className="row">
            <div className="col-xs-12">
              <Dropdown title="All Types" className="pull-left" items={types} onChange={v => this.setState({kind: v})} />
              <Dropdown title="All Categories" className="pull-left" items={categories} onChange={v => this.setState({category: v})} />
            </div>
          </div>
        </div>
        <EventStream {...this.props} category={category} kind={kind} />
      </div>
    </div>;
  }
}

class EventStream extends SafetyFirst {
  constructor (props) {
    super(props);
    this.messages = {};
    this.flushMessages = _.throttle(this.flushMessages, flushInterval);
    this.state = {
      active: true,
      sortedMessages: [],
      error: null,
      loading: true,
      oldestTimestamp: new Date(),
    };
    this.boundToggleStream = this.toggleStream.bind(this);
  }

  componentDidMount() {
    super.componentDidMount();
    this.wsInit(this.props.namespace);
  }

  wsInit (ns) {
    const params = {
      ns,
      fieldSelector: this.props.fieldSelector,
    };

    this.ws = wsFactory('sysevents', {
      host: 'auto',
      reconnect: true,
      path: watchURL(k8sKinds.Event, params),
      jsonParse: true,
      bufferEnabled: true,
      bufferFlushInterval: flushInterval,
      bufferMax: maxMessages,
    })
      .onmessage((data) => {
        const uid = data.object.metadata.uid;

        switch (data.type) {
          case 'ADDED':
          case 'MODIFIED':
            if (this.messages[uid] && this.messages[uid].count > data.object.count) {
              // We already have a more recent version of this message stored, so skip this one
              return;
            }
            if (data.object.message) {
              data.object.message = data.object.message.replace(/\\"/g, '\'');
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
        this.setState({error: false, loading: false, sortedMessages: []});
      })
      .onclose(() => {
        this.setState({sortedMessages: []});
      })
      .onerror(() => {
        this.setState({error: true, sortedMessages: []});
      });
  }

  componentWillUnmount () {
    super.componentWillUnmount();
    wsFactory.destroy('sysevents');
  }

  componentWillReceiveProps (nextProps) {
    // If the namespace has changed, created a new WebSocket with the new namespace
    if (this.props.namespace !== nextProps.namespace) {
      wsFactory.destroy('sysevents');
      this.wsInit(nextProps.namespace);
    }
  }

  // Messages can come in extremely fast when the buffer flushes.
  // Instead of calling setState() on every single message, let onmessage()
  // update an instance variable, and throttle the actual UI update (see constructor)
  flushMessages () {
    if (!_.isEmpty(this.messages)) {
    // In addition to sorting by timestamp, secondarily sort by name so that the order is consistent when events have
    // the same timestamp
      const sorted = _.orderBy(this.messages, ['lastTimestamp', 'name'], ['desc', 'asc']);
      const oldestTimestamp = _.min([this.state.oldestTimestamp, new Date(_.last(sorted).lastTimestamp)]);
      sorted.splice(maxMessages);
      this.setState({sortedMessages: sorted, oldestTimestamp});

      // Shrink this.messages back to maxMessages messages, to stop it growing indefinitely
      this.messages = _.keyBy(sorted, 'metadata.uid');
    }
  }

  filterMessages () {
    const {kind, category, filter} = this.props;

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

    return _.filter(this.state.sortedMessages, f);
  }

  toggleStream () {
    this.setState({active: !this.state.active}, () => {
      if (this.state.active) {
        this.ws.unpause();
      } else {
        this.ws.pause();
      }
    });
  }

  render () {
    const {active, error, loading, sortedMessages} = this.state;
    const filteredMessages = this.filterMessages();
    const count = filteredMessages.length;
    const allCount = sortedMessages.length;
    let sysEventStatus;

    if (allCount === 0 && this.ws && this.ws.bufferSize() === 0) {
      sysEventStatus = (
        <Box className="co-sysevent-stream__status-box-empty">
          <div className="cos-text-center cos-status-box__detail">
          No Events in the past hour
          </div>
        </Box>
      );
    }
    if (allCount > 0 && count === 0) {
      sysEventStatus = (
        <Box className="co-sysevent-stream__status-box-empty">
          <div className="cos-status-box__title">No Matching Events</div>
          <div className="cos-text-center cos-status-box__detail">
            {allCount}{allCount >= maxMessages && '+'} events exist, but none match the current filter
          </div>
        </Box>
      );
    }

    let statusBtnTxt;
    if (error) {
      statusBtnTxt = <span className="co-sysevent-stream__connection-error">Error connecting to event stream</span>;
      sysEventStatus = (
        <Box>
          <div className="cos-status-box__title cos-error-title">Error Loading Events</div>
          <div className="cos-status-box__detail cos-text-center">An error occurred during event retrieval. Attempting to reconnect...</div>
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
      <div className="row">
        <div className="col-xs-12"><p></p>
          <div className="co-sysevent-stream">
            <div className="co-sysevent-stream__totals">
              { messageCount }
            </div>

            <div className={klass}>
              <TogglePlay active={active} onClick={this.boundToggleStream} className="co-sysevent-stream__timeline__btn" />
              <div className="co-sysevent-stream__timeline__btn-text">
                {statusBtnTxt}
              </div>
              <div className="co-sysevent-stream__timeline__end-message">
              There are no events before <Timestamp timestamp={this.state.oldestTimestamp} />
              </div>
            </div>

            <TransitionGroup>
              { filteredMessages.map((m, i) => <CSSTransition key={i} classNames="slide" exit={false} timeout={{enter: 250}}>
                <SysEvent {...m} key={m.metadata.uid} />
              </CSSTransition>)}
            </TransitionGroup>

            { sysEventStatus }
          </div>
        </div>
      </div>
    </div>;
  }
}

EventStream.defaultProps = {
  kind: 'all',
  category: 'all',
};

export const ResourceEventStream = ({obj: {metadata: {name, namespace}}}) => <EventStream filter={{name}} namespace={namespace} />;
