import React from 'react';
import classNames from 'classnames';

import {LoadingInline} from '../utils';
import {DetailConfig} from './detail-config';
import {DetailStatus} from './detail-status';

export const states = {
  LOADING: 'loading',
  NEEDS_ATTENTION: 'needsattention',
  UP_TO_DATE: 'uptodate',
  UPDATE_AVAILABLE: 'updateavailable',
  PAUSING: 'pausing',
  PAUSED: 'paused',
  REQUESTED: 'requested',
  UPDATING: 'updating'
};
export const componentStates = {
  LOADING: 'loading',
  PENDING: 'pending',
  PAUSED: states.PAUSED,
  UPDATING: states.UPDATING,
  NEEDS_ATTENTION: states.NEEDS_ATTENTION,
  COMPLETE: 'complete'
};

const BreakdownComponent = ({state, text, logsUrl}) => {
  const className = {
    'fa-circle-o': state === componentStates.PENDING,
    'fa-pause-circle-o': state === componentStates.PAUSED,
    'fa-circle-o-notch fa-spin': state === componentStates.UPDATING,
    'fa-exclamation-triangle': state === componentStates.NEEDS_ATTENTION,
    'fa-check-circle': state === componentStates.COMPLETE
  };

  return <div className="co-cluster-updates__breakdown-component">
    <div className={`co-cluster-updates__breakdown-step co-cluster-updates__breakdown-step--${state}`}>
      <div className={`co-cluster-updates__breakdown-icon co-cluster-updates__breakdown-icon--${state}`}>
        <span className={classNames('fa fa-fw', className)}></span>
      </div>
      <div className="co-cluster-updates__breakdown-text">{text}</div>
    </div>
    { state !== componentStates.PENDING && logsUrl && <a className="co-cluster-updates__breakdown-button btn btn-default" href={logsUrl}>View Logs</a> }
  </div>;
};
BreakdownComponent.propTypes = {
  state: React.PropTypes.string,
  text: React.PropTypes.node,
  logsUrl: React.PropTypes.string
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

export class ChannelOperator extends React.Component {
  constructor(props) {
    super(props);
    this._isMounted = false;
    this._initialize();
    this._toggleExpand = this._toggleExpand.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this._initialize(nextProps);
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  _initialize(props = this.props) {
    const newState = _.defaults({}, props, {
      primaryComponent: {},
      state: states.LOADING,
      updateChannel: null,
      components: {},
      updateStrategy: null
    });

    newState.primaryComponent = _.get(newState.components, newState.primaryComponent) || {};
    newState.components = Object.keys(newState.components).reduce((components, key) => {
      components.push(newState.components[key]);
      return components;
    }, []);

    const aggregateState = newState.components.reduce((state, component) => {
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

      if (newState.primaryComponent.paused) {
        channelState = !channelState ? states.PAUSED : states.PAUSING;
      } else if (props.config && props.config.triggerUpdate && channelState === states.UPDATE_AVAILABLE) {
        channelState = states.REQUESTED;
      }
    }

    newState.state = channelState || states.UP_TO_DATE;

    if (this._isMounted) {
      this.setState(newState);
    } else {
      this.state = newState;
    }
  }

  _toggleExpand(event) {
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
    if (this._isState(states.UPDATING)) {
      statusText = 'Updating';
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
            {this._isState(states.UPDATING) && <span className="co-cluster-updates__breakdown-icon--updating"><span className="fa fa-circle-o-notch fa-spin fa-fw co-cluster-updates__text-icon"></span></span>}
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
            <DetailConfig config={this.state.config} field="channel" modal="configure-cluster-update-channel" displayFunction={_.capitalize} />
          </Detail>
          <Detail title="Strategy">
            <DetailConfig config={this.state.config} field="automaticUpdate" modal="configure-cluster-update-strategy" modalData={{updateAvailable: this._isState(states.UPDATE_AVAILABLE)}} displayFunction={(value) => value ? 'Automatic' : 'Admin Approval'} />
          </Detail>
          <Detail spacer={true} />
        </div>
      }
      { this.state.expanded && this.state.components.length > 0 &&
        <div className="co-cluster-updates__breakdown">
          { this.state.components.map((component, index) => <BreakdownComponent state={component.state} text={component.text} logsUrl={component.logsUrl} key={index} /> )}
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
