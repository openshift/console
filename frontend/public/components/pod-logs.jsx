import * as _ from 'lodash';
import * as React from 'react';

import { k8sKinds, resourceURL } from '../module/k8s';
import { SafetyFirst } from './safety-first';
import { Dropdown, LoadingInline, LogWindow, ResourceIcon, TogglePlay, lineBuffer, stream } from './utils';

const dataHasFailureMsg = (data) => {
  return _.includes(data, '"status": "Failure"');
};

const dataHasHTML = (data) => {
  return _.includes(data, '<html') || _.includes(data, '<HTML');
};

export class PodLogs extends SafetyFirst {
  constructor(props) {
    super(props);

    this._buffer = lineBuffer(1000);
    this._loadTime = Date.now();
    this._pendingReload = null;

    this._touchLoadTimeState = _.throttle(this._touchLoadTimeState, 100);
    this._selectContainer = this._selectContainer.bind(this);
    this._updateLogState = this._updateLogState.bind(this);
    this._toggleLogState = this._toggleLogState.bind(this);

    this.state = {
      containerNames: [],
      currentContainer: '',
      logURL: '',
      loadTime: 0,
      logState: 'loading'
    };
    this.state = _.defaults({}, this._initialState(), this.state);
  }

  componentDidMount() {
    super.componentDidMount();
    this._beginStreaming();
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this._initialState(nextProps));
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    this._endStreaming();
  }

  _initialState(props = this.props.obj) {
    const newState = {};

    const containers = _.get(props, 'spec.containers', []);
    newState.containerNames = _.map(containers, 'name');

    if (!this.state.currentContainer && newState.containerNames.length > 0) {
      newState.currentContainer = newState.containerNames[0];
    }

    const currentContainer = newState.currentContainer || this.state.currentContainer;
    newState.logURL = this._logURL(props, currentContainer);

    return newState;
  }

  _logURL(props, currentContainer) {
    return resourceURL(k8sKinds.Pod, {
      ns: _.get(props, 'metadata.namespace'),
      name: _.get(props, 'metadata.name'),
      path: 'log',
      queryParams: {
        container: currentContainer,
        follow: 'true',
        tailLines: this._buffer.maxSize
      }
    });
  }

  _selectContainer(index) {
    this._endStreaming();
    this._buffer = lineBuffer(1000);
    const currentContainer = this.state.containerNames[index];
    this.setState({
      currentContainer,
      logURL: this._logURL(this.props.obj, currentContainer),
      logState: 'loading'
    }, this._beginStreaming);
  }

  _updateLogState(newState) {
    this.setState({
      logState: newState
    });
  }

  _toggleLogState() {
    this.setState({
      logState: this.state.logState === 'streaming' ? 'paused' : 'streaming'
    });
  }

  _touchLoadTime() {
    this._touchLoadTimeState();
    this._loadTime = Date.now();
  }

  // separate function so that it can be throttled
  _touchLoadTimeState() {
    this.setState({
      loadTime: this.state.loadTime + 1
    });
  }

  _endStreaming() {
    this._stream.abort();
    clearTimeout(this._pendingReload);
  }

  _resetPendingReload() {
    const sinceLastLoad = Date.now() - this._loadTime;
    const wait = Math.max(0, (1000 * 5) - sinceLastLoad);
    this._pendingReload = setTimeout(() => {
      if (this.state.logState === 'paused') {
        // don't reset stream if the user paused the stream
        this._touchLoadTime();
        this._resetPendingReload();
        return;
      }
      this._beginStreaming();
    }, wait);
  }

  _loadStarted() {
    this.setState({
      logState: 'streaming'
    });
  }

  _processData(data) {
    if (dataHasHTML(data)) {
      this._buffer.push('Logs are currently unavailable');
    } else if (!dataHasFailureMsg(data)) {
      this._buffer.push(data);
    }

    this._touchLoadTime();
  }

  _beginStreaming() {
    clearTimeout(this._pendingReload);
    this._pendingReload = null;
    this._buffer = lineBuffer(1000);

    this._stream = stream(this.state.logURL, this._loadStarted.bind(this), this._processData.bind(this));
    this._stream.promise
      .then(() => !this._pendingReload && this._resetPendingReload()) // Load ended
      .catch((why) => { // Load failed/aborted
        if (why === 'abort') {
          return;
        }

        this._loadStarted();
        this._buffer.push(`Error: ${why}`);
        this._touchLoadTime();
        if (!this._pendingReload) {
          this._resetPendingReload();
        }
      });
  }

  render() {
    const nameWithIcon = (name) => <span><span className="co-icon-space-r"><ResourceIcon kind="Container" /></span>{name}</span>;

    return <div className="co-m-pane__body">
      <div className="co-m-pane__body__top-controls">
        { this.state.logState === 'loading'
          ? <span className="co-icon-space-l"><LoadingInline /></span>
          : <TogglePlay active={this.state.logState === 'streaming'} onClick={this._toggleLogState} /> }
        <span className="log-container-selector__text">
          { this.state.logState === 'streaming' && <span>Streaming logs from</span> }
          { this.state.logState === 'paused' && <span>Log stream is paused.</span> }
          { this.state.logState === 'loading' && <span>Loading log...</span> }
        </span>
        <Dropdown className="btn-group" items={_.mapValues(this.state.containerNames, nameWithIcon)} title={nameWithIcon(this.state.currentContainer || <LoadingInline />)} onChange={this._selectContainer} />
      </div>

      <LogWindow buffer={this._buffer} logName={this.state.currentContainer} logState={this.state.logState} updateLogState={this._updateLogState} loadGeneration={this.state.loadTime} />
    </div>;
  }
}
