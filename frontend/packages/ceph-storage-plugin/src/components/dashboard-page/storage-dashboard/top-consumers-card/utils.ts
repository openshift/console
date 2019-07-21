import * as _ from 'lodash';
import { humanizeBinaryBytesWithoutB } from '@console/internal/components/utils';
import { PrometheusResponse, DataPoint } from '@console/internal/components/graphs';

export const getMetricType = (resource, metricType) => _.get(resource, ['metric', metricType], '');

export const getGraphVectorStats: GetStats = (response, metricType, unit) => {
  const result = _.get(response, 'data.result', []);
  return result.map((r) => {
    return r.values.map((arr) => ({
      name: getMetricType(r, metricType),
      x: new Date(arr[0] * 1000),
      y: Number(humanizeBinaryBytesWithoutB(arr[1], unit).value),
    }));
  });
};

type GetStats = (response: PrometheusResponse[], metric?: string, unit?: string) => DataPoint[];
