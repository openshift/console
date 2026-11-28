import * as _ from 'lodash';
import {
  PrometheusHealthHandler,
  URLHealthHandler,
  HealthState,
} from '@openshift-console/dynamic-plugin-sdk';

// Function declarations so the module factory can initialize the exports
// before the shared module requires complete, regardless of evaluation order.
export function getFooHealthState(): ReturnType<URLHealthHandler<any>> {
  return { state: HealthState.OK };
}

export function getBarHealthState(
  responses: Parameters<PrometheusHealthHandler>[0],
  t: Parameters<PrometheusHealthHandler>[1],
  nodes: Parameters<PrometheusHealthHandler>[2],
): ReturnType<PrometheusHealthHandler> {
  if (!responses[0].response || !_.get(nodes, 'loaded')) {
    return {
      state: HealthState.LOADING,
    };
  }
  return {
    message: 'Additional message',
    state: HealthState.ERROR,
  };
}
