import * as _ from 'lodash-es';
import * as React from 'react';

import {LoadingInline} from './index';

export const operatorStates = {
  Complete: {
    suffix: 'complete',
    icon: 'fa-check-circle',
    statusText: 'Completed'
  },
  Failed: {
    suffix: 'failed',
    icon: 'fa-ban',
    statusText: 'Software update failed'
  },
  Loading: {
    suffix: 'loading',
  },
  NeedsAttention: {
    suffix: 'needs-attention',
    icon: 'fa-exclamation-triangle',
    statusText: 'Update Needs Attention'
  },
  Paused: {
    suffix: 'paused',
    icon: 'fa-pause-circle-o',
    statusText: 'Paused...'
  },
  Pausing: {
    suffix: 'pausing',
    icon: 'fa-pause-circle-o',
    statusText: 'Pausing...'

  },
  Requested: {
    suffix: 'requested',
    icon: 'fa-ban',
    statusText: 'Update Requested...'
  },
  UpdateAvailable: {
    suffix: 'update-available',
    icon: 'fa-arrow-circle-down',
    statusText: ' is available'
  },
  Updating: {
    suffix: 'updating',
    icon: 'fa-circle-o-notch fa-spin',
    statusText: 'Updating'
  },
  Pending: {
    suffix: 'pending',
    icon: 'fa-circle-o',
    statusText: 'Updating'
  },
  UpToDate: {
    suffix: 'up-to-date',
    statusText: 'Up to date'
  }
};

export const taskStatuses = {
  BackOff: {
    suffix:'backoff',
    icon: 'fa-ban'
  },
  Completed: {
    suffix:'completed',
    icon: 'fa-check-circle'
  },
  Failed: {
    suffix: 'failed',
    icon: 'fa-ban'
  },
  NotStarted: {
    suffix: 'notstarted',
    icon: 'fa-circle-o'
  },
  Running: {
    suffix: 'running',
    icon: 'fa-circle-o-notch fa-spin'
  }
};

export const orderedTaskStatuses = ['Running', 'Failed', 'BackOff', 'NotStarted', 'Completed'];

export const OperatorState = ({opState, version}) => {
  const operatorState = operatorStates[opState];
  const icon = _.get(operatorState, 'icon');
  if (opState === 'Loading') {
    return <LoadingInline />;
  }

  return <span className={`co-cluster-updates--${_.get(operatorState, 'suffix', '')}`} id="channel-state">
    {icon && <span className={`co-cluster-updates__text-icon fa ${icon} co-cluster-updates__operator-icon--${_.get(operatorState, 'suffix', '')}`}></span>}
    {opState === 'UpdateAvailable' && version } {_.get(operatorState, 'statusText', '')}
  </span>;
};

export const determineOperatorState = (operator) => {
  if (operator.failureStatus) {
    return 'Failed';
  }

  if (operator.pausedStatus) {
    return 'Paused';
  }

  if (operator.targetVersion) {
    return 'Updating';
  }

  return operator.currentVersion === operator.desiredVersion ? 'Complete' : 'Pending';
};

export const calculateChannelState = (allComponents, primaryComponent, config) => {
  let channelState;
  const priority = ['NeedsAttention', 'Updating', 'Pending'];

  const aggregateState = allComponents.reduce((state, component) => {
    state[component.state] = state[component.state] || 0;
    state[component.state] += 1;
    return state;
  }, {});

  channelState = _.find(priority, (p) => aggregateState[p] > 0);

  // "pending" doesn't match a channel state
  if (channelState === 'Pending') {
    return 'UpdateAvailable';
  }

  if (primaryComponent.pausedStatus && primaryComponent.pausedSpec) {
    return 'Paused';
  }

  if (primaryComponent.pausedSpec) {
    return 'Pausing';
  }

  if (primaryComponent.failureStatus) {
    return 'Failed';
  }

  if (config && config.triggerUpdate && channelState === 'UpdateAvailable') {
    return 'Requested';
  }

  return channelState || 'UpToDate';
};
