import * as PropTypes from 'prop-types';
import * as React from 'react';
import { Base64 } from 'js-base64';
import { saveAs } from 'file-saver';
import { Alert, AlertActionLink } from '@patternfly/react-core';

import { LoadingInline, LogWindow, TogglePlay } from './';
import * as classNames from 'classnames';
import { modelFor, resourceURL } from '../../module/k8s';
import { WSFactory } from '../../module/ws-factory';
import { LineBuffer } from './line-buffer';
import * as screenfull from 'screenfull';

export const STREAM_EOF = 'eof';
export const STREAM_LOADING = 'loading';
export const STREAM_PAUSED = 'paused';
export const STREAM_ACTIVE = 'streaming';

export const LOG_SOURCE_RESTARTING = 'restarting';
export const LOG_SOURCE_RUNNING = 'running';
export const LOG_SOURCE_TERMINATED = 'terminated';
export const LOG_SOURCE_WAITING = 'waiting';

// Messages to display for corresponding log status
const streamStatusMessages = {
  [STREAM_EOF]: 'Log stream ended.',
  [STREAM_LOADING]: 'Loading log...',
  [STREAM_PAUSED]: 'Log stream paused.',
  [STREAM_ACTIVE]: 'Log streaming...',
};

// Component for log stream controls
const LogControls = ({dropdown, onDownload, toggleFullscreen, isFullscreen, status, toggleStreaming}) => {
  const expandCompressClass = classNames('fa', {
    'fa-expand': !isFullscreen,
    'fa-compress': isFullscreen,
  });
  return <div className="co-toolbar">
    <div className="co-toolbar__group co-toolbar__group--left">
      <div className="co-toolbar__item">
        { status === STREAM_LOADING && <React.Fragment><LoadingInline />&nbsp;</React.Fragment> }
        { [STREAM_ACTIVE, STREAM_PAUSED].includes(status) && <TogglePlay active={status === STREAM_ACTIVE} onClick={toggleStreaming} />}
        {streamStatusMessages[status]}
      </div>
      {dropdown && <div className="co-toolbar__item">{dropdown}</div>}
    </div>
    <div className="co-toolbar__group co-toolbar__group--right">
      <button className="btn btn-link" onClick={onDownload}>
        <i className="fa fa-download" aria-hidden="true"></i>&nbsp;Download
      </button>
      <span aria-hidden="true" className="co-action-divider hidden-xs">|</span>
      <button className="btn btn-link" onClick={toggleFullscreen}>
        <i className={expandCompressClass} aria-hidden="true"></i>&nbsp;{isFullscreen ? 'Collapse' : 'Expand'}
      </button>
    </div>
  </div>;
};

// Resource agnostic log component
export class ResourceLog extends React.Component {
  constructor(props) {
    super(props);
    this._buffer = new LineBuffer(props.bufferSize);
    this._download = this._download.bind(this);
    this._toggleFullscreen = this._toggleFullscreen.bind(this);
    this._onClose = this._onClose.bind(this);
    this._onError = this._onError.bind(this);
    this._onMessage = this._onMessage.bind(this);
    this._onOpen = this._onOpen.bind(this);
    this._restartStream = this._restartStream.bind(this);
    this._toggleStreaming = this._toggleStreaming.bind(this);
    this._updateStatus = this._updateStatus.bind(this);
    this._resourceLogRef = React.createRef();
    this.state = {
      error: false,
      lines: [],
      linesBehind: 0,
      resourceStatus: LOG_SOURCE_WAITING,
      stale: false,
      status: STREAM_LOADING,
      isFullscreen: false,
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.resourceStatus !== prevState.resourcStatus) {
      const newState = {};
      newState.resourceStatus = nextProps.resourceStatus;
      // Container changed from non-running to running state, so currently displayed logs are stale
      if (prevState.resourceStatus === LOG_SOURCE_RESTARTING && newState.resourceStatus !== LOG_SOURCE_RESTARTING) {
        newState.stale = true;
      }
      return newState;
    }
    return null;
  }

  componentDidMount() {
    this._wsInit(this.props);
    if (screenfull.enabled) {
      screenfull.on('change', () => {
        this.setState({ isFullscreen: screenfull.isFullscreen });
      });
      screenfull.on('error', () => {
        this.setState({ isFullscreen: false });
      });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const containerChanged = prevProps.containerName !== this.props.containerName;
    const resourceStarted = prevState.resourceStatus === LOG_SOURCE_WAITING && this.state.resourceStatus !== LOG_SOURCE_WAITING;

    // Container changed or transitioned out of waiting state
    if (containerChanged || resourceStarted) {
      this._restartStream();
    }
  }

  componentWillUnmount() {
    this._wsDestroy();
    screenfull.off('change');
    screenfull.off('error');
  }

  // Download currently displayed log content
  _download() {
    const {resourceName, containerName} = this.props;
    const blob = this._buffer.getBlob({type: 'text/plain;charset=utf-8'});
    let filename = resourceName;
    if (containerName) {
      filename = `${filename}-${containerName}`;
    }
    saveAs(blob, `${filename}.log`);
  }

  // Handler for websocket onclose event
  _onClose(){
    this.setState({ status: STREAM_EOF });
  }

  // Handler for websocket onerror event
  _onError(){
    this.setState({
      error: true,
    });
  }

  // Handler for websocket onmessage event
  _onMessage(msg){
    const { linesBehind, status } = this.state;
    if (msg){
      const text = Base64.decode(msg);
      const linesAdded = this._buffer.ingest(text);
      this.setState({
        linesBehind: status === STREAM_PAUSED ? linesBehind + linesAdded : linesBehind,
        lines: this._buffer.getLines(),
      });
    }
  }

  // Handler for websocket onopen event
  _onOpen(){
    this._buffer.clear();
    this._updateStatus(STREAM_ACTIVE);
  }

  // Destroy and reinitialize websocket connection
  _restartStream() {
    this.setState({
      error: false,
      lines: [],
      linesBehind: 0,
      stale: false,
      status: STREAM_LOADING,
    }, () => {
      this._wsDestroy();
      this._wsInit(this.props);
    });
  }

  // Toggle currently displayed log content to/from fullscreen
  _toggleFullscreen() {
    const logConsole = this._resourceLogRef.current;
    if (!logConsole) {
      return;
    }

    if (screenfull.enabled) {
      screenfull.toggle(logConsole);
    }
  }

  // Toggle streaming/paused status
  _toggleStreaming() {
    const newStatus = this.state.status === STREAM_ACTIVE ? STREAM_PAUSED : STREAM_ACTIVE;
    this._updateStatus(newStatus);
  }

  // Updates log status
  _updateStatus(newStatus) {
    const {status} = this.state;
    const newState = {status: newStatus};

    // Reset linesBehind when transitioning out of paused state
    if (status !== STREAM_ACTIVE && newStatus === STREAM_ACTIVE) {
      newState.linesBehind = 0;
    }
    this.setState(newState);
  }

  // Destroy websocket
  _wsDestroy() {
    this.ws && this.ws.destroy();
  }

  // Initialize websocket connection and wire up handlers
  _wsInit({kind, namespace, resourceName, containerName, bufferSize}) {
    if ([LOG_SOURCE_RUNNING, LOG_SOURCE_TERMINATED, LOG_SOURCE_RESTARTING].includes(this.state.resourceStatus)) {
      const urlOpts = {
        ns: namespace,
        name: resourceName,
        path: 'log',
        queryParams: {
          container: containerName || '',
          follow: 'true',
          tailLines: bufferSize,
        },
      };
      const watchURL = resourceURL(modelFor(kind), urlOpts);
      const wsOpts = {
        host: 'auto',
        path: watchURL,
        subprotocols: ['base64.binary.k8s.io'],
      };

      this.ws = new WSFactory(watchURL, wsOpts)
        .onclose(this._onClose)
        .onerror(this._onError)
        .onmessage(this._onMessage)
        .onopen(this._onOpen);
    }
  }

  render() {
    const {dropdown, kind, bufferSize} = this.props;
    const {error, lines, linesBehind, stale, status, isFullscreen} = this.state;
    const bufferFull = lines.length === bufferSize;

    return <React.Fragment>
      {error && <Alert
        isInline
        className="co-alert"
        variant="danger"
        title="An error occured while retrieving the requested logs."
        action={<AlertActionLink onClick={this._restartStream}>Retry</AlertActionLink>}
      />}
      {stale && <Alert
        isInline
        className="co-alert"
        variant="info"
        title={`The logs for this ${kind} may be stale.`}
        action={<AlertActionLink onClick={this._restartStream}>Refresh</AlertActionLink>}
      />}
      <div ref={this._resourceLogRef} className={classNames('resource-log', {'resource-log--fullscreen': isFullscreen})}>
        <LogControls
          dropdown={dropdown}
          isFullscreen={isFullscreen}
          onDownload={this._download}
          status={status}
          toggleFullscreen={this._toggleFullscreen}
          toggleStreaming={this._toggleStreaming} />
        <LogWindow
          lines={lines}
          linesBehind={linesBehind}
          bufferFull={bufferFull}
          isFullscreen={isFullscreen}
          status={status}
          updateStatus={this._updateStatus} />
      </div>
    </React.Fragment>;
  }
}

ResourceLog.defaultProps = {
  bufferSize: 1000,
};

ResourceLog.propTypes = {
  bufferSize: PropTypes.number.isRequired,
  containerName: PropTypes.string,
  dropdown: PropTypes.element,
  kind: PropTypes.string.isRequired,
  namespace: PropTypes.string.isRequired,
  resourceName: PropTypes.string.isRequired,
  resourceStatus: PropTypes.string.isRequired,
};
