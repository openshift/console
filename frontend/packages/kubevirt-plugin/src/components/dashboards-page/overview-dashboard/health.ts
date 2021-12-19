import * as _ from 'lodash';
import { URLHealthHandler } from '@console/plugin-sdk';
import { HealthState } from '@console/shared/src/components/dashboard/status-card/states';

export const getKubevirtHealthState: URLHealthHandler<KubevirtHealthResponse> = (
  response,
  error,
) => {
  if (error) {
    return { state: HealthState.NOT_AVAILABLE };
  }
  if (!response) {
    return { state: HealthState.LOADING };
  }
  return _.get(response, 'apiserver.connectivity') === 'ok'
    ? { state: HealthState.OK }
    : { state: HealthState.ERROR };
};

type KubevirtHealthResponse = {
  apiserver: {
    connectivity: string;
  };
};
