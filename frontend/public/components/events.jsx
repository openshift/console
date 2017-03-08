import React from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import classNames from 'classnames';

import {k8sKinds, watchURL} from '../module/k8s';
import {SafetyFirst} from './safety-first';
import {Dropdown, ResourceLink, Box, Loading, NavBar, navFactory, NavTitle, Timestamp, TogglePlay, pluralize} from './utils';
import {wsFactory} from '../module/ws-factory';

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
            kind={obj.kind.toLowerCase()}
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
              <span> on <Link to={`nodes/${this.props.source.host}/details`}>{this.props.source.host}</Link></span>
            }
          </small>
        </div>
      </div>
    );
  }
}

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
    return <div>
      <Helmet title="Events" />
      <NavTitle title="Events" />
      <div className="co-m-pane">
        <div className="co-m-pane__heading">
          <div className="row">
            <div className="col-xs-12">
              <Dropdown title="All Types" className="pull-left" items={{all: 'All Types', pod: 'Pods', node: 'Nodes'}} onChange={kind => {this.setState({kind});}} />
              <Dropdown title="All Categories" className="pull-left" items={{all: 'All Categories', info: 'Info', error: 'Error'}} onChange={category => {this.setState({category});}} />
            </div>
          </div>
        </div>

        <div className="co-m-pane__body">
          <div className="row">
            <div className="col-xs-12"><p></p>
              <EventStream {...this.props} category={category} kind={kind} />
            </div>
          </div>
        </div>
      </div>
    </div>;
  }
}

export const EventStream = connect(state => ({ns: state.UI.get('activeNamespace')}))(
class EventStream_ extends SafetyFirst {
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
    this.wsInit(props.ns);
  }

  wsInit (ns) {
    const params = {
      ns,
      fieldSelector: this.props.fieldSelector,
    };

    this.ws = wsFactory('sysevents', {
      host: 'auto',
      reconnect: true,
      path: watchURL(k8sKinds.EVENT, params),
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
    if (nextProps.ns !== this.props.ns) {
      wsFactory.destroy('sysevents');
      this.wsInit(nextProps.ns);
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
            No Events
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

    return (
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
        { filteredMessages.map(m => <SysEvent {...m} key={m.metadata.uid} />) }
        { sysEventStatus }
      </div>
    );
  }
});

EventStream.defaultProps = {
  kind: 'all',
  category: 'all',
};

const {details, editYaml, pods, logs, events} = navFactory;

const EventStreamResource = (props) => {
  const name = props.params.name;
  const filter = {name};

  return <div className="co-p-node-sysevents">
    <Helmet title={`${props.kind} Events`} />
    <NavTitle title={name} kind={props.kind} detail="true" />
    <div className="co-m-pane co-m-vert-nav">
      <NavBar pages={props.pages} />
      <div className="co-m-vert-nav__body">
        <div className="co-m-vert-nav__body">
          <div className="co-m-pane__body">
            <div className="row">
              <div className="col-xs-12"><p></p>
                <EventStream {...props} filter={filter} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>;
};

export const EventStreamPod = (props) => <EventStreamResource
  kind="pod"
  pages={[details(), editYaml(), logs(), events()]}
  {...props}
/>;

export const EventStreamNode = (props) => <EventStreamResource
  kind="node"
  pages={[details(), editYaml(), pods(), events()]}
  {...props}
/>;

export const EventStreamReplicationController = (props) => <EventStreamResource
  kind="replicationcontroller"
  pages={[details(), editYaml(), pods(), events()]}
  {...props}
/>;
