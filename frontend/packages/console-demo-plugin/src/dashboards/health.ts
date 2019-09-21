import * as _ from 'lodash';
import { HealthState } from '@console/internal/components/dashboard/health-card/states';
import { PrometheusHealthHandler, URLHealthHandler } from '@console/plugin-sdk';

export const getFooHealthState: URLHealthHandler<any> = () => ({ state: HealthState.OK });

export const getBarHealthState: PrometheusHealthHandler = (responses = [], errors = [], nodes) => {
  if (!responses.length || !errors.length || !_.get(nodes, 'loaded')) {
    return {
      state: HealthState.LOADING,
    };
  }
  return {
    message: 'Additional message',
    state: HealthState.ERROR,
  };
};
