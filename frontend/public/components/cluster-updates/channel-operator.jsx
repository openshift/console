import React from 'react';
import classNames from 'classnames';

import {LoadingInline, taskStatuses, OperatorState, operatorStates, calculateChannelState} from '../utils';
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
        <OperatorState opState={channelState} version={primaryComponent.desiredVersion} />
      </div>
    }
    <a className="co-cluster-updates__toggle" onClick={onClick}>{expanded ? 'Collapse' : 'Expand'}</a>
  </div>;
};

const DetailWrapper = ({title, children}) => {
  return <dl className="co-cluster-updates__detail">
    <dt>{title}</dt>
    <dd>{children}</dd>
  </dl>;
};
DetailWrapper.propTypes = {
  title: React.PropTypes.node,
  children: React.PropTypes.node
};

const Details = ({config, channelState, primaryComponent}) => {
  if (config.loadError) {
    return <div className="co-cluster-updates__details">
      <DetailWrapper title="Current Version">
        {primaryComponent.currentVersion || <LoadingInline />}
      </DetailWrapper>
    </div>;
  }

  return <div className="co-cluster-updates__details">
    <DetailWrapper title="Status">
      <DetailStatus config={config} channelState={channelState} version={primaryComponent.desiredVersion} />
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
  </div>;
};

const FailureStatus = ({failureStatus}) => {
  if (!failureStatus) {
    return null;
  }
  const type = _.includes(['Human decision needed', 'Voided warranty'], failureStatus.type) ? 'warning' : 'failed';
  return <div className={`co-cluster-updates__message-box co-cluster-updates__message-box--${type}`}>
    <span>
      {failureStatus.type} : {failureStatus.reason}
    </span>
  </div>;
};

const Operator = ({component, cols, isPrimaryComponent}) => {
  const {state, headerText, logsUrl} = component;
  const suffix = _.get(operatorStates[state], 'suffix', '');
  const icon = _.get(operatorStates[state], 'icon');

  return <div className={`co-cluster-updates__operator-component col-xs-${cols}`}>
    <div className="co-cluster-updates__operator-step">
      {(state === 'Complete' || state === 'Pending') && <div className={`co-cluster-updates__operator-icon co-cluster-updates__operator-icon--${suffix}`}>
        <span className={classNames('fa fa-fw', icon)}></span>
      </div>}
      <div className="co-cluster-updates__operator-text">{headerText}</div>
    </div>
    {state !== 'Complete' && logsUrl && <div className="co-cluster-updates__operator-step"><a className="co-cluster-updates__breakdown-button btn btn-default" href={logsUrl}>View Logs</a></div>}
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
    const icon = _.get(taskStatuses[state], 'icon');

    return <div className="co-cluster-updates__operator-ts-component">
      <div className="co-cluster-updates__operator-ts-step">
        <div className={`co-cluster-updates__operator-icon co-cluster-updates__operator-ts--${suffix}`}>
          <span className={classNames('fa fa-fw', icon)}></span>
        </div>
        <div className="co-cluster-updates__operator-text">
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
//The other operator currently shown is Kubernetes Version Operator
export class ChannelOperator extends SafetyFirst{
  constructor(props) {
    super(props);
    this._toggleExpand = this._toggleExpand.bind(this);
    this.state = {
      expanded: true
    };
  }

  _toggleExpand(event) {
    event.preventDefault();
    this.setState({
      expanded: !this.state.expanded
    });
    event.target.blur();
  }

  render() {
    const {primaryOperatorName, components, config} = this.props;
    const primaryOperator = _.get(components, primaryOperatorName) || {};
    const operators = Object.keys(components).reduce((ops, key) => {
      ops.push(components[key]);
      return ops;
    }, []);

    const secondaryOperators = Object.keys(components).reduce((ops, key) => {
      if (key !== primaryOperatorName) {
        ops.push(components[key]);
      }
      return ops;
    }, []);
    const operatorCols = Math.floor(12/components.length);
    const channelState =  components.length === 0 ? 'Loading' : calculateChannelState(operators, primaryOperator, config);

    return <div>
      <Header channelState={channelState}
        primaryComponent={primaryOperator}
        expanded={this.state.expanded}
        onClick={this._toggleExpand} />
      { this.state.expanded &&
        <div>
          <Details config={config}
            channelState={channelState}
            primaryComponent={primaryOperator} />
          <FailureStatus failureStatus={primaryOperator.failureStatus} />
          <div className="co-cluster-updates__operator">
            {primaryOperator && <Operator component={primaryOperator} cols={operatorCols} isPrimaryComponent={true}/>}
            {secondaryOperators.length > 0 && _.map(secondaryOperators, (component, index) => <Operator component={component} key={index} cols={operatorCols} isPrimaryComponent={false} /> )}
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
