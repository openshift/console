import * as PropTypes from 'prop-types';
import * as React from 'react';
import { Base64 } from 'js-base64';
import { saveAs } from 'file-saver';

import { LoadingInline, LogWindow, TogglePlay } from './';
import { modelFor, resourceURL } from '../../module/k8s';
import { SafetyFirst } from '../safety-first';
import { WSFactory } from '../../module/ws-factory';


// Messages to display for corresponding log status
const streamStatusMessages = {
  eof: 'Log stream ended.',
  loading: 'Loading log...',
  paused: 'Log stream paused.',
  streaming: 'Log streaming...'
};

// Component for log stream controls
// TODO Fix styling for this. If no dropdown is there, the download button will not right-align
const LogControls = ({dropdown, onDownload, status, toggleStreaming}) => {
  return <div className="co-m-pane__top-controls">
    { status === 'loading' && <span className="co-icon-space-l"><LoadingInline />&nbsp;</span> }
    { ['streaming', 'paused'].includes(status) && <span className="log-stream-control"><TogglePlay active={status === 'streaming'} onClick={toggleStreaming}/></span>}
    <span className="log-container-selector__text">
      {streamStatusMessages[status]}
    </span>
    {dropdown && <span style={{flexGrow: 1}}>{dropdown}</span>}
    <button className="btn btn-default" onClick={onDownload}>
      <i className="fa fa-download" aria-hidden="true"></i>&nbsp;Download
    </button>
  </div>;
};

// Resource agnostic log component
export class ResourceLog extends SafetyFirst {
  constructor(props) {
    super(props);
    this._buffer = [];
    this._download = this._download.bind(this);
    this._onClose = this._onClose.bind(this);
    this._onError = this._onError.bind(this);
    this._onMessage = this._onMessage.bind(this);
    this._onOpen = this._onOpen.bind(this);
    this._restartStream = this._restartStream.bind(this);
    this._toggleStreaming = this._toggleStreaming.bind(this);
    this._updateStatus = this._updateStatus.bind(this);
    this.state = {
      alive: true,
      error: false,
      lines: [],
      linesBehind: 0,
      stale: false,
      status: 'loading'
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.alive !== prevState.alive) {
      let newState = {};
      newState.alive = nextProps.alive;
      // Container changed from non-running to running state, so currently displayed logs are stale
      if (nextProps.alive && !prevState.alive) {
        newState.stale = true;
      }
      return newState;
    }
    return null;
  }

  componentDidMount() {
    super.componentDidMount();
    this._wsInit(this.props);
  }

  componentDidUpdate(prevProps) {
    // Container changed
    if (prevProps.containerName !== this.props.containerName) {
      this._restartStream();
    }
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    this._wsDestroy();
  }

  // Download currently displayed log content
  _download () {
    const blob = new Blob([this._buffer.join('')], {type: 'text/plain;charset=utf-8'});
    let filename = this.props.resourceName;
    if (this.props.containerName) {
      filename = `${filename}-${this.props.containerName}`;
    }
    saveAs(blob, `${filename}.log`);
  }

  // Handler for websocket onclose event
  _onClose(){
    this.setState({ status: 'eof'});
  }

  // Handler for websocket onerror event
  _onError(){
    this.setState({
      error: true
    });
  }

  // Handler for websocket onmessage event
  _onMessage(msg){
    const text = Base64.decode(msg);
    const linesBehind = this.state.status === 'paused' ? this.state.linesBehind + 1 : 0;
    if (text){
      this._pushToBuffer(text);
      this.setState({
        linesBehind,
        lines: this._buffer
      });
    }
  }

  // Handler for websocket onopen event
  _onOpen(){
    this._buffer = [];
    this.setState({status: 'streaming'});
  }

  // Push one line to the buffer. First item is removed if buffer is at limit.
  _pushToBuffer(text){
    if (this._buffer.length === this.props.bufferSize) {
      this._buffer.shift();
    }
    this._buffer.push(text);
  }

  // Destroy and reinitialize websocket connection
  _restartStream() {
    this.setState({
      error: false,
      stale: false
    }, () => {
      this._wsDestroy();
      this._wsInit(this.props);
    });
  }

  // Toggle streaming/paused status
  _toggleStreaming() {
    const newStatus = this.state.status === 'streaming' ? 'paused' : 'streaming';
    this.setState({
      status: newStatus
    });
  }

  // Updates log status
  _updateStatus(newStatus) {
    let newState = {status: newStatus};

    // Reset linesBehind when transitioning out of paused state
    if (this.state.status === 'paused' && newStatus !== this.state.status) {
      newState.linesBehind = 0;
    }
    this.setState(newState);
  }

  // Destroy websocket
  _wsDestroy() {
    this.ws && this.ws.destroy();
  }

  // Initialize websocket connection and wire up handlers
  _wsInit ({kind, namespace, resourceName, containerName, bufferSize}) {
    const urlOpts = {
      ns: namespace,
      name: resourceName,
      path: 'log',
      queryParams: {
        container: containerName || '',
        follow: 'true',
        tailLines: bufferSize
      }
    };
    const watchURL = resourceURL(modelFor(kind), urlOpts);
    const wsOpts = {
      host: 'auto',
      path: watchURL,
      subprotocols: ['base64.binary.k8s.io']
    };

    this.ws = new WSFactory(watchURL, wsOpts)
      .onclose(this._onClose)
      .onerror(this._onError)
      .onmessage(this._onMessage)
      .onopen(this._onOpen);
  }

  render() {
    const {dropdown, kind, bufferSize} = this.props;
    const {error, lines, linesBehind, stale, status} = this.state;
    const bufferFull = lines.length === bufferSize;

    // TODO create alert component or use pf-react alerts here.
    return <React.Fragment>
      {error && <p className="alert alert-danger">
        <span className="pficon pficon-error-circle-o" aria-hidden="true"></span>
        An error occured while retrieving the requested logs.
        <button className="btn btn-link" onClick={this._restartStream} >
          Retry
        </button>
      </p>}
      {stale && <p className="alert alert-info">
        <span className="pficon pficon-info" aria-hidden="true"></span>
        The logs for this {kind} may be stale.
        <button className="btn btn-link" onClick={this._restartStream} >
          Refresh
        </button>
      </p>}
      <LogControls
        dropdown={dropdown}
        status={status}
        toggleStreaming={this._toggleStreaming}
        onDownload={this._download} />
      <LogWindow
        lines={lines}
        linesBehind={linesBehind}
        bufferFull={bufferFull}
        status={status}
        updateStatus={this._updateStatus} />
    </React.Fragment>;
  }
}

ResourceLog.defaultProps = {
  bufferSize: 1000
};

ResourceLog.propTypes = {
  alive: PropTypes.bool.isRequired,
  bufferSize: PropTypes.number.isRequired,
  containerName: PropTypes.string,
  dropdown: PropTypes.element,
  kind: PropTypes.string.isRequired,
  namespace: PropTypes.string.isRequired,
  resourceName: PropTypes.string.isRequired
};
