import * as _ from 'lodash-es';
import { RootState } from '../../redux';
import { getURLSearchParams } from '../utils/link';
import { alertsToProps } from './utils';

import {
  LOG_SOURCE_RESTARTING,
  LOG_SOURCE_RUNNING,
  LOG_SOURCE_TERMINATED,
  LOG_SOURCE_WAITING,
} from '../utils';

import { AlertDetailProps } from './alert-logs';

export const containersToStatuses = ({ status }, containers) => {
  return _.reduce(
    containers,
    (accumulator, { name }, order) => {
      const containerStatus =
        _.find(status.containerStatuses, { name }) ||
        _.find(status.initContainerStatuses, { name });
      if (containerStatus) {
        return {
          ...accumulator,
          [name]: { ...containerStatus, order },
        };
      }
      return accumulator;
    },
    {},
  );
};

export const containerToLogSourceStatus = (container) => {
  if (!container) {
    return LOG_SOURCE_WAITING;
  }

  const { state, lastState } = container;

  if (state.waiting && !_.isEmpty(lastState)) {
    return LOG_SOURCE_RESTARTING;
  }

  if (state.waiting) {
    return LOG_SOURCE_WAITING;
  }

  if (state.terminated) {
    return LOG_SOURCE_TERMINATED;
  }

  return LOG_SOURCE_RUNNING;
};

export const alertStateToProps = (state: RootState, props): AlertDetailProps => {
  const { match } = props;
  const perspective = _.has(match.params, 'ns') ? 'dev' : 'admin';
  const { data, loaded, loadError } = alertsToProps(state, perspective);
  const ruleID = match?.params?.ruleID;
  const labels = getURLSearchParams();
  const alerts = _.filter(data, (a) => a.rule.id === ruleID);
  const rule = alerts?.[0]?.rule;
  const alert = _.find(alerts, (a) => _.isEqual(a.labels, labels));
  return {
    alert,
    loaded,
    loadError,
    rule,
  };
};
