import * as _ from 'lodash';
import { DataPoint } from '@console/internal/components/graphs';

export type PrometheusResponse = {
  status: string;
  data: {
    resultType: 'matrix' | 'vector' | 'scalar' | 'string';
    result: PrometheusMetricResult | PrometheusMetricResult[];
  };
  errorType?: string;
  error?: string;
  warnings?: string[];
};

export const getInstantVectorStats: (
  response: PrometheusResponse,
  metric?: string,
) => DataPoint[] = (response, metric) => {
  const results = _.get(response, 'data.result', []);
  return results.map((r) => {
    const y = _.get(r, 'value[1]');
    return {
      x: _.get(r, ['metric', metric], ''),
      y,
    };
  });
};

type PrometheusMetricResult = {
  metric: { [key: string]: any };
  values?: [number, string | number][];
  value?: [number, string | number];
};
