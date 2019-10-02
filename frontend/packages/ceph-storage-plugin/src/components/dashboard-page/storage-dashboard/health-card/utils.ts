import * as _ from 'lodash';
import { HealthState } from '@console/internal/components/dashboard/health-card/states';
import { PrometheusHealthHandler } from '@console/plugin-sdk';

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
    state: HealthState.UNKNOWN,
  },
];

export const getCephHealthState: PrometheusHealthHandler = (responses = [], errors = []) => {
  if (errors.length) {
    return CephHealthStatus[3];
  }
  if (!responses[0]) {
    return { state: HealthState.LOADING };
  }

  const value = _.get(responses[0], 'data.result[0].value[1]');
  return CephHealthStatus[value] || CephHealthStatus[3];
};
