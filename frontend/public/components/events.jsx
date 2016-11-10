import React from 'react';

import classNames from 'classnames';

import {angulars, register} from './react-wrapper';
import {Dropdown, ResourceLink, Box, Loading, Timestamp, TogglePlay, pluralize} from './utils';

import {wsFactory} from '../module/ws-factory';

const maxMessages = 500;
const flushInterval = 500;

const eventID = (se) => {
  return `U:${se.metadata.uid}`;
};


class SysEvent extends React.Component {
  shouldComponentUpdate(nextProps) {
    return !(nextProps.metadata.uid && nextProps.metadata.uid === this.props.metadata.uid && nextProps.count === this.props.count);
  }

  render() {
    const klass = classNames('co-sysevent', {'co-sysevent--error': categoryFilter('error', this.props)});
    const obj = this.props.involvedObject;
    const tooltipMsg = `${this.props.reason} (${obj.kind.toLowerCase()})`;

    return (
      <div key={eventID(this.props)} className={klass}>
        <div className="co-sysevent__icon-box">
          <i className="co-sysevent-icon" title={tooltipMsg} />
          <div className="co-sysevent__icon-line"></div>
        </div>
        <div className="co-sysevent__main-box">
          <ResourceLink
            kind={obj.kind}
            namespace={obj.namespace}
            name={obj.name}
            uid={obj.uid}
          />
          <div className="co-sysevent__main-message">{this.props.message}</div>
        </div>
        <div className="co-sysevent__meta-box">
          <div><Timestamp timestamp={this.props.lastTimestamp}/></div>
          <small className="co-sysevent__meta-source">
            Generated from <span>{this.props.source.component}</span>
            {this.props.source.component === 'kubelet' &&
              <span> on <a href={`nodes/${this.props.source.host}`}>{this.props.source.host}</a></span>
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
    return (
      <div className="co-m-pane">
        <div className="co-m-pane__heading">
          <div className="row">
            <div className="col-xs-12">
              <Dropdown title='All Types' className="pull-left" items={{all: 'All Types', pod: 'Pods', node: 'Nodes'}} onChange={kind => {this.setState({kind});}} />
              <Dropdown title='All Categories' className="pull-left" items={{all: 'All Categories', info: 'Info', error: 'Error'}} onChange={category => {this.setState({category});}} />
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
    );
  }
}

register('EventStreamPage', EventStreamPage);

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


export class EventStream extends React.Component {
  constructor (props) {
    super(props);
    this.ws = null;
    this.oldestTimestamp = new Date();
    this.messages = [];
    this.flushStateUpdates = _.throttle(this.flushStateUpdates, flushInterval);
    this.state = {
      active: true,
      messages: [],
      error: null,
      loading: true,
      oldestTimestamp: this.oldestTimestamp,
    };
    this.boundToggleStream = this.toggleStream.bind(this);
  }

  componentWillUnmount() {
    wsFactory.destroy('sysevents');
    this.flushStateUpdates.cancel();
  }

  componentDidMount () {
    const params = {
      ns: this.props.namespace,
      fieldSelector: this.props.fieldSelector,
    };

    this.ws = wsFactory('sysevents', {
      host: 'auto',
      reconnect: true,
      path: angulars.k8s.resource.watchURL(angulars.kinds.EVENT, params),
      jsonParse: true,
      bufferEnabled: true,
      bufferFlushInterval: flushInterval,
      bufferMax: maxMessages,
    })
    .onmessage((data) => {
      if (data.object.message) {
        data.object.message = data.object.message.replace(/\\"/g, '\'');
      }

      data.sortTimestamp = 1 - new Date(data.object.lastTimestamp);

      switch (data.type) {
        case 'ADDED':
          this.insertMessage(data);
          break;
        case 'MODIFIED':
          this.updateMessage(data);
          break;
        case 'DELETED':
          this.deleteMessage(data);
          break;
        default:
          // eslint-disable-next-line no-console
          console.error(`UNHANDLED EVENT: ${data.type}`);
          return;
      }

      if (this.messages.length > maxMessages) {
        this.messages = this.messages.slice(0, maxMessages);
      }

      const lastTimestamp = new Date(data.object.lastTimestamp);
      if (this.oldestTimestamp > lastTimestamp) {
        this.oldestTimestamp = lastTimestamp;
      }

      this.flushStateUpdates();
    })
    .onopen(() => {
      this.setState({
        error: false,
        loading: false,
      });
      this.messages = [];
      this.flushStateUpdates();
    })
    .onclose(() => {
      this.messages = [];
      this.flushStateUpdates();
    })
    .onerror(() => {
      this.setState({ error: true });
      this.messages = [];
      this.flushStateUpdates();
    });
  }

  findMessageIndex(uid) {
    return _.findIndex(this.messages, message => message.object.metadata.uid === uid);
  }

  insertMessage(data) {
    const insertIndex = _.sortedIndexBy(this.messages, data, function(o) { return o.sortTimestamp; });

    this.messages.splice(insertIndex, 0, data);
  }

  updateMessage(data) {
    const existingMessageIndex = this.findMessageIndex(data.object.metadata.uid);
    if (existingMessageIndex >= 0) {
      this.messages.splice(existingMessageIndex, 1, data);
    } else {
      this.insertMessage(data);
    }
  }

  deleteMessage(data) {
    const existingMessageIndex = this.findMessageIndex(data.object.metadata.uid);
    if (existingMessageIndex >= 0) {
      this.messages.splice(existingMessageIndex, 1);
    }
  }

  // Messages can come in extremely fast when the buffer flushes.
  // Instead of calling setState() on every single message, let onmessage()
  // update an instance variable, and throttle the actual UI update (see constructor)
  flushStateUpdates() {
    this.setState({
      messages: this.messages,
      oldestTimestamp: this.oldestTimestamp
    });
  }

  filterMessages () {
    const {kind, category, filter} = this.props;

    const f = (e) => {
      const obj = e.object;
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

    return _.chain(this.state.messages)
      .filter(f)
      .value()
    ;
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
    const {
      active,
      error,
      loading,
      messages,
    } = this.state;

    const filteredMessages = this.filterMessages().map(m => <SysEvent {...m.object} key={eventID(m.object)} />);
    let sysEventStatus;

    if (messages.length === 0 && this.ws && this.ws.bufferSize() === 0) {
      sysEventStatus = (
        <Box className="co-sysevent-stream__status-box-empty">
          <div className="cos-text-center cos-status-box__detail">
            No Events
          </div>
        </Box>
      );
    }
    if (messages.length > 0 && filteredMessages.length === 0) {
      sysEventStatus = (
        <Box className="co-sysevent-stream__status-box-empty">
          <div className="cos-status-box__title">No Matching Events</div>
          <div className="cos-text-center cos-status-box__detail">
            {messages.length} events exist, but none match the current filter
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

    const count = filteredMessages.length;
    const klass = classNames('co-sysevent-stream__timeline', {
      'co-sysevent-stream__timeline--empty': !messages.length || !count
    });
    const messageCount = count < maxMessages ? `Showing ${pluralize(count, 'event')}` : `Showing ${count} of ${messages.length}+ events`;

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
        { filteredMessages }

        { sysEventStatus }
      </div>
    );
  }
}

EventStream.defaultProps = {
  kind: 'all',
  category: 'all',
};

register('EventStream', EventStream);
