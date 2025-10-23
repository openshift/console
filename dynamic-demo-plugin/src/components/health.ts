import * as _ from 'lodash';
import { PrometheusHealthHandler, URLHealthHandler, HealthState } from '@openshift-console/dynamic-plugin-sdk';

export const getFooHealthState: URLHealthHandler<any> = () => ({ state: HealthState.OK });

export const getBarHealthState: PrometheusHealthHandler = (responses, t, nodes) => {
  if (!responses[0].response || !_.get(nodes, 'loaded')) {
    return {
      state: HealthState.LOADING,
    };
  }
  return {
    message: 'Additional message',
    state: HealthState.ERROR,
  };
};
