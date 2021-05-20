import * as _ from 'lodash';

import { PrometheusResponse } from '@console/internal/components/graphs';

type Metrics = {
  critical?: number;
  important?: number;
  low?: number;
  moderate?: number;
};

export const mapMetrics = (response: PrometheusResponse): Metrics => {
  const values: Metrics = {};
  for (let i = 0; i < response.data.result.length; i++) {
    const value = response.data?.result?.[i]?.value?.[1];
    if (_.isNil(value)) {
      return null;
    }
    const metricName = response.data?.result?.[i]?.metric?.metric;
    if (values[metricName] === -1 || values[metricName] === undefined) {
      values[metricName] = parseInt(value, 10);
    }
  }

  return values;
};

// An error occurred while requesting Insights results (e.g. IO is turned off)
export const isError = (values: Metrics) => _.isEmpty(values);

/* Insights Operator is disabled (e.g. pull-secret is removed) or has been
   just initialized and waiting for the first results. */
export const isWaitingOrDisabled = (values: Metrics) =>
  Object.values(values).some((cur: number) => cur === -1);
