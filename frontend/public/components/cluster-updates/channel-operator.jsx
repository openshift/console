import React from 'react';
import classNames from 'classnames';

import {LoadingInline} from '../utils';
import {configureOperatorStrategyModal} from '../modals';
import {DetailConfig} from './detail-config';
import {DetailStatus} from './detail-status';
import {SafetyFirst} from '../safety-first';

export const states = {
  FAILED: 'failed',
  LOADING: 'loading',
  NEEDS_ATTENTION: 'needsattention',
  PAUSED: 'paused',
  PAUSING: 'pausing',
  REQUESTED: 'requested',
  UPDATE_AVAILABLE: 'updateavailable',
  UPDATING: 'updating',
  UP_TO_DATE: 'uptodate'
};

export const componentStates = {
  COMPLETE: 'complete',
  FAILED: 'failed',
  LOADING: 'loading',
  NEEDS_ATTENTION: states.NEEDS_ATTENTION,
  PAUSED: states.PAUSED,
  PENDING: 'pending',
  UPDATING: states.UPDATING
};

export const taskStatuses = {
  'BACKOFF': 'backoff',
  'COMPLETED': 'completed',
  'FAILED': 'failed',
  'NOTSTARTED': 'notstarted',
  'RUNNING': 'running'
};

export const getFailedTypeClassName = (type) => {
  return _.includes(['Human decision needed', 'Voided warranty'], type) ? 'warning' : 'failed';
};

export class TaskStatusComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isErrorMsgVisible: false
    };
  }

  render() {
    const {name, state, reason} = this.props.taskStatus;
    const lowerCaseState = state.toLowerCase();

    const taskStatusClassName = {
      'fa-circle-o-notch fa-spin': lowerCaseState === taskStatuses.RUNNING,
      'fa-ban': lowerCaseState === taskStatuses.FAILED || lowerCaseState === taskStatuses.BACKOFF,
      'fa-check-circle': lowerCaseState === taskStatuses.COMPLETED,
      'fa-circle-o': lowerCaseState === taskStatuses.NOTSTARTED,
    };

    return <div className="co-cluster-updates__breakdown-ts-component">
      <div className="co-cluster-updates__breakdown-ts-step">
        <div className={`co-cluster-updates__breakdown-icon co-cluster-updates__breakdown-ts-icon--${lowerCaseState}`}>
          <span className={classNames('fa fa-fw', taskStatusClassName)}></span>
        </div>
        <div className={`co-cluster-updates__breakdown-text co-cluster-updates__breakdown-ts-text--${lowerCaseState}`}>{name}</div>
      </div>
      { reason && !this.props.isPrimaryComponent && <div className="co-cluster-updates__breakdown-ts-error-msg-link">
          <a onClick={() => {this.setState({isErrorMsgVisible : !this.state.isErrorMsgVisible});}}>
            {this.state.isErrorMsgVisible ? 'Hide Failed Reason' : 'Show Failed Reason'}
          </a>
        </div>
      }
      { reason && !this.props.isPrimaryComponent && this.state.isErrorMsgVisible && <div className="co-cluster-updates__breakdown-ts-error-msg">{reason}</div> }
    </div>;
  }
}

const BreakdownComponent = ({component, cols, isPrimaryComponent}) => {

  const {state, headerText, logsUrl} = component;

  const componentStateClassName = {
    'fa-circle-o': state === componentStates.PENDING,
    'fa-pause-circle-o': state === componentStates.PAUSED,
    'fa-circle-o-notch fa-spin': state === componentStates.UPDATING,
    'fa-exclamation-triangle': state === componentStates.NEEDS_ATTENTION,
    'fa-check-circle': state === componentStates.COMPLETE,
    'fa-ban': state === componentStates.FAILED
  };

  return <div className={`co-cluster-updates__breakdown-component col-xs-${cols}`}>
    <div className="co-cluster-updates__breakdown-step">
      {component.taskStatuses && component.taskStatuses.length === 0 && <div className={`co-cluster-updates__breakdown-icon co-cluster-updates__breakdown-icon--${state}`}>
        <span className={classNames('fa fa-fw', componentStateClassName)}></span>
      </div>}
      <div className={classNames('co-cluster-updates__breakdown-text', {'co-cluster-updates__breakdown-header' : component.taskStatuses && component.taskStatuses.length})}>{headerText}</div>
    </div>
    { _.map(component.taskStatuses, (taskStatus, index) => <TaskStatusComponent taskStatus={taskStatus} key={index} isPrimaryComponent={isPrimaryComponent} /> ) }
    { state !== componentStates.PENDING && logsUrl && <a className="co-cluster-updates__breakdown-button btn btn-default" href={logsUrl}>View Logs</a> }
  </div>;
};
BreakdownComponent.propTypes = {
  component: React.PropTypes.object,
  cols: React.PropTypes.number,
  isPrimaryComponent: React.PropTypes.bool
};

const Detail = ({title, spacer, children}) => {
  const spacerClass = spacer ? 'co-cluster-updates__detail--spacer' : null;
  return <dl className={classNames('co-cluster-updates__detail', spacerClass)}>
    { spacer || <dt>{title}</dt> }
    { spacer || <dd>{children}</dd> }
  </dl>;
};
Detail.propTypes = {
  title: React.PropTypes.node,
  spacer: React.PropTypes.bool,
  children: React.PropTypes.node
};

// ChannelOperator is intended to be a generic UI component that
// takes in pre-parsed data and displays it in a consistent manner,
// regardless of which channel (Tectonic or Container Linux) is
// being displayed.
//
// Ideally, channels operate exactly the same - they all share
// the same updated/updating/paused/etc states and basic
// config parameters. ChannelOperator aggregates those states,
// versions, & configs into the UI.
//
// However, ChannelOperator and it's sub-components ended up being
// built a little less generic than originally intended, so there
// is a bit of refactoring to be done when the Container Linux
// channel gets built.
export class ChannelOperator extends SafetyFirst{
  constructor(props) {
    super(props);
    this._initialize();
    this._toggleExpand = this._toggleExpand.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this._initialize(nextProps);
  }

  _initialize(props = this.props) {
    const newState = _.defaults({}, props, {
      primaryComponent: {},
      state: states.LOADING,
      updateChannel: null,
      components: {},
      updateStrategy: null,
      allComponents: null
    });

    newState.primaryComponent = _.get(newState.components, props.primaryComponent) || {};

    newState.allComponents = Object.keys(newState.components).reduce((components, key) => {
      components.push(newState.components[key]);
      return components;
    }, []);

    newState.components = Object.keys(newState.components).reduce((components, key) => {
      if (key !== props.primaryComponent) {
        components.push(newState.components[key]);
      }
      return components;
    }, []);

    const aggregateState = newState.allComponents.reduce((state, component) => {
      state[component.state] = state[component.state] || 0;
      state[component.state] += 1;
      return state;
    }, {});

    let channelState;
    if (newState.components.length === 0) {
      channelState = states.LOADING;
    } else {
      const priority = [componentStates.NEEDS_ATTENTION, componentStates.UPDATING, componentStates.PENDING];
      channelState = _.find(priority, (priority) => aggregateState[priority] > 0);

      // "pending" doesn't match a channel state
      if (channelState === componentStates.PENDING) {
        channelState = states.UPDATE_AVAILABLE;
      }

      if (newState.primaryComponent.pausedStatus && newState.primaryComponent.pausedSpec) {
        channelState = states.PAUSED;
      } else if (newState.primaryComponent.pausedSpec) {
        channelState = states.PAUSING;
      } else if (newState.primaryComponent.failureStatus) {
        channelState = states.FAILED;
      } else if (props.config && props.config.triggerUpdate && channelState === states.UPDATE_AVAILABLE) {
        channelState = states.REQUESTED;
      }
    }

    newState.state = channelState || states.UP_TO_DATE;
    if (this.isMounted_) {
      this.setState(newState);
    } else {
      this.state = newState;
    }
  }

  _toggleExpand(event) {
    event.preventDefault();
    this.setState({
      expanded: !this.state.expanded
    });
    event.target.blur();
  }

  _isState(s) {
    return this.state.state === s;
  }

  render() {
    let statusText;
    const operatorCols = Math.floor(12/this.state.components.length);
    const failureStatus = this.state.primaryComponent.failureStatus;

    if (this._isState(states.UPDATING)) {
      statusText = <span><span className="co-cluster-updates__breakdown-icon--updating"><span className="fa fa-circle-o-notch fa-spin fa-fw co-cluster-updates__text-icon"></span></span>Updating</span>;
    } else if (this._isState(states.UPDATE_AVAILABLE)) {
      statusText = <span className="co-cluster-updates__update-available-text"><span className="fa fa-arrow-circle-down fa-fw co-icon-space-r"></span>{this.state.primaryComponent.desiredVersion} is available</span>;
    } else if (this._isState(states.UP_TO_DATE)) {
      statusText = 'Up to date';
    } else if (this._isState(states.NEEDS_ATTENTION)) {
      statusText = <span className="co-cluster-updates__needs-attention-text"><span className="fa fa-exclamation-triangle fa-fw co-icon-space-r"></span>Update Needs Attention</span>;
    } else if (this._isState(states.PAUSING)) {
      statusText = 'Pausing...';
    } else if (this._isState(states.PAUSED)) {
      statusText = 'Paused';
    } else if (this._isState(states.REQUESTED)) {
      statusText = 'Update requested...';
    } else if (this._isState(states.LOADING)) {
      statusText = <LoadingInline />;
    } else if (this._isState(states.FAILED)) {
      statusText = <span className="co-cluster-updates__update-failed-text"><span className="fa fa-ban co-icon-space-r"></span>Software update failed</span>;
    } else {
      statusText = 'Unknown';
    }

    return <div className={classNames('co-cluster-updates__component', {'co-cluster-updates__component--last': this.props.last})}>
      <div className="co-cluster-updates__heading">
        <div className="co-cluster-updates__heading--name-wrapper">
          <span className="co-cluster-updates__heading--name">{this.props.type}</span>
          { this.state.expanded || <span className="co-cluster-updates__heading--version">{this.state.primaryComponent.currentVersion}</span> }
        </div>
        { this.state.expanded ||
          <div className="co-cluster-updates__heading--updates">
            {statusText}
          </div>
        }
        <a className="co-cluster-updates__toggle" href="#" onClick={this._toggleExpand}>{this.state.expanded ? 'Collapse' : 'Expand'}</a>
      </div>
      { this.state.expanded &&
        <div className="co-cluster-updates__details">
          <Detail title="Status">
            <DetailStatus config={this.state.config} statusText={statusText} state={this.state.state} />
          </Detail>
          <Detail title="Current Version">
            {this.state.primaryComponent.currentVersion || <LoadingInline />}
          </Detail>
          <Detail title="Channel">
            <DetailConfig config={this.state.config} field="channel" displayFunction={_.capitalize} />
          </Detail>
          <Detail title="Strategy">
            <DetailConfig config={this.state.config} field="automaticUpdate" modal={configureOperatorStrategyModal} modalData={{updateAvailable: this._isState(states.UPDATE_AVAILABLE)}} displayFunction={(value) => value ? 'Automatic' : 'Admin Approval'} />
          </Detail>
          <Detail spacer={true} />
        </div>
      }
      { this.state.expanded && failureStatus &&
        <div className={`co-cluster-updates__message-box co-cluster-updates__message-box--${getFailedTypeClassName(failureStatus.type)}`}>
          <span>
            {failureStatus.type} : {failureStatus.reason}
          </span>
        </div>
      }
      { this.state.expanded && this.state.primaryComponent && this.state.components.length > 0 &&
        <div className="co-cluster-updates__breakdown">
          <BreakdownComponent component={this.state.primaryComponent} cols={operatorCols} isPrimaryComponent={true}/>
          { _.map(this.state.components, (component, index) => <BreakdownComponent component={component} key={index} cols={operatorCols} isPrimaryComponent={false} /> )}
        </div>
      }
    </div>;
  }
}
ChannelOperator.propTypes = {
  config: React.PropTypes.object,
  last: React.PropTypes.bool,
  type: React.PropTypes.string.isRequired
};
