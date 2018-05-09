import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';
import * as React from 'react';

import { resourceURL, modelFor } from '../../module/k8s';
import { SafetyFirst } from '../safety-first';
import { LineBuffer, LoadingInline, LogWindow, stream, TogglePlay } from './';

const logStatusMessages = {
  eof: 'Log stream ended.',
  loading: 'Loading log...',
  paused: 'Log stream paused.',
  streaming: 'Log streaming...'
};

const dataHasFailureMsg = (data) => {
  return _.includes(data, '"status": "Failure"');
};

const dataHasHTML = (data) => {
  return _.includes(data, '<html') || _.includes(data, '<HTML');
};

// Component for the streaming controls
const LogControls = ({status, toggleStreaming, dropdown}) => {
  return <div className="co-m-pane__top-controls">
    { status === 'loading' && <span className="co-icon-space-l"><LoadingInline /></span> }
    { ['streaming', 'paused'].includes(status) && <span className="log-stream-control"><TogglePlay active={status === 'streaming'} onClick={toggleStreaming}/></span>}
    <span className="log-container-selector__text">
      {logStatusMessages[status]}
    </span>
    {dropdown && <span>{dropdown}</span>}
  </div>;
};

export class ResourceLog extends SafetyFirst {
  constructor(props) {
    super(props);

    this._buffer = new LineBuffer(this.props.bufferSize);
    this._loadStarted = this._loadStarted.bind(this);
    this._processData = this._processData.bind(this);
    this._retry = _.throttle(this._retry, 5000);
    this._toggleStreaming = this._toggleStreaming.bind(this);
    this._updateStatus = this._updateStatus.bind(this);

    this.state = {
      touched: Date.now(),
      status: 'loading',
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const newState = {};

    if(nextProps.eof){
      newState.status = prevState.status === 'paused' ? 'paused' : 'eof';
    }
    return newState;
  }

  componentDidMount() {
    super.componentDidMount();
    this._beginStreaming();
  }

  componentDidUpdate(prevProps){
    // If container changed, restart streaming
    if (this.props.containerName && this.props.containerName !== prevProps.containerName) {
      this._restartStreaming();
    }
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    this._endStreaming();
  }

  // Updates log status as long as eof has not been reached
  _updateStatus(newStatus) {
    // If log is at eof, don't update state to anything other than eof
    this.setState((prevState, props) => {
      return {
        status: props.eof ? 'eof' : newStatus
      };
    });
  }

  // use _updateStatus toggle streaming/paused state instead of directly
  // setting logState
  _toggleStreaming() {
    this._updateStatus(this.state.status === 'streaming' ? 'paused' : 'streaming');
  }

  // separate function so that it can be throttled
  _touch() {
    this.setState({
      touched: Date.now()
    });
  }

  _pushToBuffer(data){
    this._buffer.push(data);
    this._touch();
  }

  _clearBuffer(){
    this._buffer.clear();
    this._touch();
  }

  // Callback which handles the XMLHttpRequest "loadstart" event.
  _loadStarted() {
    this._updateStatus('streaming');
  }

  // Callback to process data from the XMLHttpRequest "progress" event
  _processData(data) {
    if (dataHasHTML(data)) {
      this._pushToBuffer('Logs are currently unavailable');
    } else if (!dataHasFailureMsg(data)) {
      this._pushToBuffer(data);
    }
  }

  // Retry loading logs every five seconds (see constructor where this function is throttled).
  _retry() {
    // If stream is paused, don't begin stream agian
    if (this.state.status === 'paused') {
      this._touch();
      this._retry(); // Try to refresh again
    } else {
      this._beginStreaming();
    }
  }

  // Resets buffer and starts a new stream.
  _beginStreaming() {
    const url = resourceURL(modelFor(this.props.kind), {
      ns: this.props.namespace,
      name: this.props.resourceName,
      path: 'log',
      queryParams: {
        container: this.props.containerName || '',
        follow: 'true',
        tailLines: this.props.bufferSize
      }
    });
    this._clearBuffer();
    this._stream = stream(url, this._loadStarted, this._processData);
    this._stream.promise
      .then(() => {
        // Resource is no longer running/generating new log content, so stop streaming
        if (this.props.eof){
          this._endStreaming();
        } else {
          // Request resolved, but resource is still in a non-terminated state, retry streaming
          this._retry();
        }
      })
      .catch((why) => { // Load failed/aborted
        if (why !== 'abort') {
          this._pushToBuffer(`Error: ${why}`);
          this._retry();
        }
      });
  }

  // Abort XMLHttpRequest
  _endStreaming() {
    this._stream && this._stream.abort();
  }

  // Ends current stream and starts a new one.
  _restartStreaming(){
    this._endStreaming();
    this._beginStreaming();
  }

  render() {
    return <div className="co-m-pane__body">
      <LogControls
        dropdown={this.props.dropdown}
        status={this.state.status}
        toggleStreaming={this._toggleStreaming} />
      <LogWindow
        buffer={this._buffer}
        touched={this.state.touched}
        status={this.state.status}
        updateStatus={this._updateStatus} />
    </div>;
  }
}

ResourceLog.defaultProps = {
  bufferSize: 1000,
  label: '',
};

ResourceLog.propTypes = {
  bufferSize: PropTypes.number.isRequired,
  containerName: PropTypes.string,
  dropdown: PropTypes.element,
  eof: PropTypes.bool.isRequired,
  kind: PropTypes.string.isRequired,
  namespace: PropTypes.string.isRequired,
  resourceName: PropTypes.string.isRequired,
};
