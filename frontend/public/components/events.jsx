import React from 'react';

import classNames from 'classnames';

import {angulars, register} from './react-wrapper';
import {Dropdown, ResourceLink, Box, Loading, Timestamp} from './utils';

import {wsFactory} from '../module/ws-factory';

const maxMessages = 500;

// TODO: split into util component later
const TogglePlay = ({className, active, onClick}) => {
  const klass = classNames('co-toggle-play fa', className, active ? 'co-toggle-play--active' : 'co-toggle-play--inactive');
  return <button className={klass} onClick={onClick}></button>;
}

const eventID = (se) => {
  // This is a workaround for a Kubernetes bug that is being
  // addressed, where some events are missing uids.  It should be
  // removed if the issue is fixed in Kubernetes 1.2 or greater.
  if (se.metadata.uid) {
    return `U:${se.metadata.uid}`;
  }
  return `N:${se.metadata.name}:${se.metadata.resourceVersion}`;
}


const SysEvent = (se) => {
  const klass = classNames('co-sysevent', `co-sysevent--${se.reason.toLowerCase()}`);

  const tooltipMsg = `${se.reason} (${se.involvedObject.kind.toLowerCase()})`;

  return (
    <div key={eventID(se)} className={klass}>
      <div className="co-sysevent__icon-box">
        <i className="co-sysevent-icon" title={tooltipMsg} />
        <div className="co-sysevent__icon-line"></div>
      </div>
      <div className="co-sysevent__main-box">
        <ResourceLink
          kind={se.involvedObject.kind}
          namespace={se.involvedObject.namespace}
          name={se.involvedObject.name}
          uid={se.involvedObject.uid}
        />
        <div className="co-sysevent__main-message">{se.message}</div>
      </div>
      <div className="co-sysevent__meta-box">
        <div><Timestamp timestamp={se.lastTimestamp}/></div>
        <small className="co-sysevent__meta-source">
          Generated from <span>{se.source.component}</span>
          {se.source.component === 'kubelet' &&
            <span> on <a href={`nodes/${se.source.host}`}>{se.source.host}</a></span>
          }
        </small>
      </div>
    </div>
  );
};

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
              <Dropdown title='Object Type' className="pull-left" items={{all: 'All', pod: 'Pods', node: 'Nodes'}} onChange={kind => {this.setState({kind})}} />
              <Dropdown title='Event Category' className="pull-left" items={{all: 'All', info: 'Info', error: 'Error'}} onChange={category => {this.setState({category})}} />
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

const filterMap = {
  error: {
    pod: ['failed', 'failedScheduling'],
    node: ['offline'],
  },
  info: {
    pod: ['created', 'pulling', 'pulled', 'killing', 'started', 'scheduled'],
    node: ['online', 'starting'],
  }
};

// Predicate function to filter by event "category" (info, error, etc)
const categoryFilter = (category, {involvedObject, reason}) => {
  if (category === 'all') {
    return true;
  }
  const kind = involvedObject.kind.toLowerCase();
  const reasons = filterMap[category][kind];
  return (reasons && reasons.indexOf(reason.toLowerCase()) !== -1);
}

const kindFilter = (kind, {involvedObject}) => {
  return kind === 'all' || involvedObject.kind.toLowerCase() === kind;
};


export class EventStream extends React.Component {
  constructor (props) {
    super(props);
    this.ws = null;
    this.state = {
      active: true,
      messages: [],
      error: null,
      loading: true,
      oldestTimestamp: null,
    };
  }

  componentWillUnmount() {
    wsFactory.destroy('sysevents');
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
      bufferFlushInterval: 500,
      bufferMax: maxMessages,
    })
    .onmessage((data) => {
      if (data.object.message) {
        data.object.message = data.object.message.replace(/\\"/g, '\'');
      }
      let messages = this.state.messages
      messages.unshift(data);
      this.setState({
        messages: messages,
        oldestTimestamp: messages.slice(-1)[0].object.lastTimestamp,
      });
    })
    .onopen(() => {
      this.setState({
        error: false,
        messages: [],
        loading: false,
      });
    })
    .onclose(() => {
      this.setState({
        messages: [],
      });
    })
    .onerror(() => {
      this.setState({
        error: true,
        messages: [],
      });
    });
  }

  filterMessages () {
    const {kind, category} = this.props;
    return _.chain(this.state.messages)
      .filter(e => categoryFilter(category, e.object) && kindFilter(kind, e.object))
      .uniqBy(e => eventID(e.object))
      .sortBy(e => e.object.lastTimestamp)
      .reverse()
      .slice(0, maxMessages)
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
    const klass = classNames('co-sysevent-stream__timeline', {
      'co-sysevent-stream__timeline--empty': !messages.length || !filteredMessages.length
    });

    const count = filteredMessages.length;
    const messageCount = count < maxMessages ? `Showing ${count} events` : `Showing ${count} of ${messages.length} events`;

    let statusBtnTxt;
    let sysEventStatus;
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

    return (
      <div>
        <div className="co-sysevent-stream">
          <div className="co-sysevent-stream__totals">
            { messageCount }
          </div>

          <div className={klass}>
            <TogglePlay active={this.state.active} onClick={() => this.toggleStream()} className="co-sysevent-stream__timeline__btn" />
            <div className="co-sysevent-stream__timeline__btn-text">
              {statusBtnTxt}
            </div>
            <div className="co-sysevent-stream__timeline__end-message">
              There are no events before <Timestamp timestamp={this.state.oldestTimestamp} />
            </div>
          </div>
          { filteredMessages }

          { filteredMessages.length === 0 && messages.length > 0 &&
            <Box className="co-sysevent-stream__status-box-empty">
              <div>No Matching Events</div>
              <div className="cos-text-center">
                {messages.length} events exist, but none match the current filter
              </div>
            </Box>
          }

          {sysEventStatus}

          {!sysEventStatus && messages.length === 0 && this.ws && this.ws.bufferSize() === 0 &&
            <Box className="co-sysevent-stream__status-box-empty">
              <div className="cos-status-box__detail cos-text-center">
                No Events
              </div>
            </Box>
          }
        </div>
      </div>
    );
  }
}

register('EventStream', EventStream);
