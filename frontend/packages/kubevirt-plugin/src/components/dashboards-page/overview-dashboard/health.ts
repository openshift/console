import * as _ from 'lodash';

import { HealthState } from '@console/internal/components/dashboard/health-card/states';
import { SubsystemHealth } from '@console/internal/components/dashboards-page/overview-dashboard/health-card';

import { ERROR, HEALTHY } from './strings';

export const getKubevirtHealthState = (response): SubsystemHealth => {
  if (!response) {
    return { state: HealthState.LOADING };
  }
  return _.get(response, 'apiserver.connectivity') === 'ok'
    ? { message: HEALTHY, state: HealthState.OK }
    : { message: ERROR, state: HealthState.ERROR };
};
