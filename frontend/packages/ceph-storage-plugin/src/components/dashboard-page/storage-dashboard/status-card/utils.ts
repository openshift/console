import * as _ from 'lodash';
import { HealthState } from '@console/shared/src/components/dashboard/status-card/states';
import { PrometheusHealthHandler } from '@console/plugin-sdk';
import { getResiliencyProgress } from '../../../../utils';

const CephHealthStatus = [
  {
    state: HealthState.OK,
  },
  {
    state: HealthState.WARNING,
  },
  {
    state: HealthState.ERROR,
  },
  {
    state: HealthState.NOT_AVAILABLE,
  },
];

export const getCephHealthState: PrometheusHealthHandler = (responses = [], errors = []) => {
  if (errors[0]) {
    return CephHealthStatus[3];
  }
  if (!responses[0]) {
    return { state: HealthState.LOADING };
  }

  const value = _.get(responses[0], 'data.result[0].value[1]');
  return CephHealthStatus[value] || CephHealthStatus[3];
};

export const getDataResiliencyState: PrometheusHealthHandler = (responses = [], errors = []) => {
  const progress: number = getResiliencyProgress(responses[0]);
  if (errors[0]) {
    return { state: HealthState.UNKNOWN };
  }
  if (!responses[0]) {
    return { state: HealthState.LOADING };
  }
  if (Number.isNaN(progress)) {
    return { state: HealthState.UNKNOWN };
  }
  if (progress < 1) {
    return { state: HealthState.PROGRESS };
  }
  return { state: HealthState.OK };
};
