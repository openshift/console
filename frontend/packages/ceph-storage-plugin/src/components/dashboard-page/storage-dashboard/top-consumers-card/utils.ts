import * as _ from 'lodash';
import { humanizeBinaryBytesWithoutB } from '@console/internal/components/utils';
import { PrometheusResponse, DataPoint } from '@console/internal/components/graphs';

export const getMetricType = (resource, metricType) => _.get(resource, ['metric', metricType], '');

export const getGraphVectorStats: GetStats = (response, metricType, unit) => {
  return response.map((r) => {
    return r.values.map((arr) => ({
      name: getMetricType(r, metricType),
      x: new Date(arr[0] * 1000),
      y: Number(humanizeBinaryBytesWithoutB(arr[1], null, unit).value),
    }));
  });
};

export const sortResources = (stats: any, metricType: string) => {
  return stats.sort(function(a, b) {
    const aVal = _.get(a, 'values');
    const bVal = _.get(b, 'values');
    const x = _.get(a, ['values', aVal.length - 1, 1]);
    const y = _.get(b, ['values', bVal.length - 1, 1]);
    if (x === y) {
      const aNameVal = _.get(a, 'metric');
      const bNameVal = _.get(b, 'metric');
      return aNameVal[metricType] < bNameVal[metricType]
        ? -1
        : aNameVal[metricType] > bNameVal[metricType]
        ? 1
        : 0;
    }
    return y - x;
  });
};

type GetStats = (
  response: PrometheusResponse['data']['result'],
  metric?: string,
  unit?: string,
) => DataPoint[][];
