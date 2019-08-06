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

export const getfilteredTopConsumerStats: FilterTopConsumer = (
  scLoaded,
  topConsumerStats,
  filteredSCNames,
) => {
  let filteredTopConsumerStats = [];
  const result = _.get(topConsumerStats, 'data.result', []);
  if (scLoaded) {
    filteredTopConsumerStats = result.filter((stats: PrometheusResponse['data']['result']) =>
      filteredSCNames.includes(_.get(stats, 'metric.storageclass')),
    );
  }
  return filteredTopConsumerStats;
};

type GetStats = (
  response: PrometheusResponse['data']['result'][],
  metric?: string,
  unit?: string,
) => DataPoint[][];

type FilterTopConsumer = (
  scLoaded: boolean,
  topConsumerStats: PrometheusResponse,
  filteredSCNames: string[],
) => PrometheusResponse['data']['result'][];
