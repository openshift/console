import React from 'react';
import classNames from 'classnames';

import {LoadingInline, taskStatuses, OperatorState, operatorStates, calculateChannelState, StatusBox} from '../utils';
import {configureOperatorStrategyModal} from '../modals';
import {DetailConfig} from './detail-config';
import {DetailStatus} from './detail-status';
import {SafetyFirst} from '../safety-first';

const Header = ({channelState, primaryComponent, expanded, onClick}) => {
  return <div className="co-cluster-updates__heading">
    <div className="co-cluster-updates__heading--name-wrapper">
      <span className="co-cluster-updates__heading--name">Tectonic</span>
      { expanded || <span className="co-cluster-updates__heading--version">{primaryComponent.currentVersion}</span> }
    </div>
    { expanded ||
      <div className="co-cluster-updates__heading--updates">
        <OperatorState state={channelState} version={primaryComponent.desiredVersion} />
      </div>
    }
    <a className="co-cluster-updates__toggle" href="#" onClick={onClick}>{expanded ? 'Collapse' : 'Expand'}</a>
  </div>;
};

const DetailWrapper = ({title, spacer, children}) => {
  const spacerClass = spacer ? 'co-cluster-updates__detail--spacer' : null;
  return <dl className={classNames('co-cluster-updates__detail', spacerClass)}>
    { spacer || <dt>{title}</dt> }
    { spacer || <dd>{children}</dd> }
  </dl>;
};
DetailWrapper.propTypes = {
  title: React.PropTypes.node,
  spacer: React.PropTypes.bool,
  children: React.PropTypes.node
};

const Details = ({config, channelState, primaryComponent}) => {
  if (config.loadError) {
    return  <div className="co-cluster-updates__details">
      <DetailWrapper title="Current Version">
        {primaryComponent.currentVersion || <LoadingInline />}
      </DetailWrapper>
    </div>;
  }

  return <div className="co-cluster-updates__details">
    <DetailWrapper title="Status">
      <DetailStatus config={config} state={channelState} version={primaryComponent.desiredVersion} />
    </DetailWrapper>
    <DetailWrapper title="Current Version">
      {primaryComponent.currentVersion || <LoadingInline />}
    </DetailWrapper>
    <DetailWrapper title="Channel">
      <DetailConfig config={config} field="channel" displayFunction={_.capitalize} />
    </DetailWrapper>
    <DetailWrapper title="Strategy">
      <DetailConfig config={config} field="automaticUpdate" modal={configureOperatorStrategyModal}
        modalData={{updateAvailable: channelState === 'UpdateAvailable'}}
        displayFunction={(value) => value ? 'Automatic' : 'Admin Approval'} />
    </DetailWrapper>
    <DetailWrapper spacer={true} />
  </div>;
};

const FailureStatus = ({failureStatus}) => {
  if (!failureStatus) {
    return null;
  }
  const type = _.includes(['Human decision needed', 'Voided warranty'], failureStatus.type) ? 'warning' : 'failed';
  return  <div className={`co-cluster-updates__message-box co-cluster-updates__message-box--${type}`}>
    <span>
      {failureStatus.type} : {failureStatus.reason}
    </span>
  </div>;
};

const Operator = ({component, cols, isPrimaryComponent}) => {
  const {state, headerText, logsUrl} = component;
  const suffix = _.get(operatorStates[state], 'suffix', '');
  const icon = _.get(operatorStates[state], 'icon', '');

  return <div className={`co-cluster-updates__operator-component col-xs-${cols}`}>
    <div className="co-cluster-updates__operator-step">
      {(state === 'Complete' || state === 'Pending') && <div className={`co-cluster-updates__operator-icon co-cluster-updates__operator-icon--${suffix}`}>
        <span className={classNames('fa fa-fw', icon)}></span>
      </div>}
      <div className="co-cluster-updates__operator-text">{headerText}</div>
    </div>
    {state !== 'Complete' && logsUrl && <div><a className="co-cluster-updates__breakdown-button btn btn-default" href={logsUrl}>View Logs</a></div>}
    {_.map(component.taskStatuses, (taskStatus, index) => <TaskStatus taskStatus={taskStatus} key={index} isPrimaryComponent={isPrimaryComponent} /> )}
  </div>;
};
Operator.propTypes = {
  component: React.PropTypes.object,
  cols: React.PropTypes.number,
  isPrimaryComponent: React.PropTypes.bool
};

export class TaskStatus extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isErrorMsgVisible: false
    };
  }

  render() {
    const {name, state, reason} = this.props.taskStatus;
    const suffix = _.get(taskStatuses[state], 'suffix', '');
    const icon = _.get(taskStatuses[state], 'icon', '');

    return <div className="co-cluster-updates__operator-ts-component">
      <div className="co-cluster-updates__operator-ts-step">
        <div className={`co-cluster-updates__operator-icon co-cluster-updates__operator-ts--${suffix}`}>
          <span className={classNames('fa fa-fw', icon)}></span>
        </div>
        <div className={`co-cluster-updates__operator-text co-cluster-updates__operator-ts--${suffix}`}>
          {name}
        </div>
      </div>
      { reason && !this.props.isPrimaryComponent && <div className="co-cluster-updates__operator-ts-error-msg-link">
          <a onClick={() => {this.setState({isErrorMsgVisible : !this.state.isErrorMsgVisible});}}>
            {this.state.isErrorMsgVisible ? 'Hide Failed Reason' : 'Show Failed Reason'}
          </a>
        </div>
      }
      { reason && !this.props.isPrimaryComponent && this.state.isErrorMsgVisible && <div className="co-cluster-updates__operator-ts-error-msg">{reason}</div> }
    </div>;
  }
}

//Displays details about Channel Operators
//Primary operator is Tectonic Channel Operator
//The other operator currently shown is Kubertenes Version Operator
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
      channelState: 'Loading',
      components: {},
      allComponents: null,
      expanded: true
    });

    if (!props.components.loadError) {
      newState.primaryComponent = _.get(newState.components, props.primaryOperatorName) || {};

      newState.allComponents = Object.keys(newState.components).reduce((components, key) => {
        components.push(newState.components[key]);
        return components;
      }, []);

      newState.components = Object.keys(newState.components).reduce((components, key) => {
        if (key !== props.primaryOperatorName) {
          components.push(newState.components[key]);
        }
        return components;
      }, []);

      newState.channelState = newState.components.length === 0 ? 'Loading' : calculateChannelState(newState.allComponents, newState.primaryComponent, props.config);
    }

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

  render() {
    const operatorCols = Math.floor(12/this.state.components.length);
    const failureStatus = this.state.primaryComponent.failureStatus;

    if (this.props.components.loadError) {
      return <StatusBox loadError={this.props.components.loadError} label="Operators" />;
    }

    return <div>
      <Header channelState={this.state.channelState}
        primaryComponent={this.state.primaryComponent}
        expanded={this.state.expanded}
        onClick={this._toggleExpand} />
      { this.state.expanded &&
        <div>
          <Details config={this.state.config}
            channelState={this.state.channelState}
            primaryComponent={this.state.primaryComponent} />
          <FailureStatus failureStatus={failureStatus} />
          <div className="co-cluster-updates__operator">
            {this.state.primaryComponent && <Operator component={this.state.primaryComponent} cols={operatorCols} isPrimaryComponent={true}/>}
            {this.state.components.length > 0 && _.map(this.state.components, (component, index) => <Operator component={component} key={index} cols={operatorCols} isPrimaryComponent={false} /> )}
          </div>
        </div>
      }
    </div>;
  }
}
ChannelOperator.propTypes = {
  primaryOperatorName: React.PropTypes.string,
  config: React.PropTypes.object,
  components: React.PropTypes.object,
};
