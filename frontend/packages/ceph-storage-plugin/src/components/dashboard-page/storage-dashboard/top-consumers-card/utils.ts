import * as _ from 'lodash';
import { humanizeBinaryBytesWithoutB } from '@console/internal/components/utils';
import { PrometheusResponse, DataPoint } from '@console/internal/components/graphs';

export const getMetricType = (resource, metricType) => _.get(resource, ['metric', metricType], '');

export const getGraphVectorStats: GetStats = (response, metricType, unit) => {
  return response.map((r) => {
    return r.values.map((arr) => ({
      name: getMetricType(r, metricType),
      x: new Date(arr[0] * 1000),
      y: Number(humanizeBinaryBytesWithoutB(arr[1], unit).value),
    }));
  });
};

export const sortResources: SortResourcesProps = (a, b) => {
  const aVal = _.get(a, 'values');
  const bVal = _.get(b, 'values');
  const x = _.get(a, ['values', aVal.length - 1, 1]);
  const y = _.get(b, ['values', bVal.length - 1, 1]);
  return y - x;
};

type GetStats = (
  response: PrometheusResponse['data']['result'],
  metric?: string,
  unit?: string,
) => DataPoint[][];

type SortResourcesProps = (
  a: PrometheusResponse['data']['result'],
  b: PrometheusResponse['data']['result'],
) => number;
