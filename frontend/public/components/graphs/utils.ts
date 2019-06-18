import * as _ from 'lodash-es';

import { PrometheusResponse, DataPoint, MutatorFunction } from '.';

export const getRangeVectorStats: GetStats = response => {
  const values = _.get(response, 'data.result[0].values');
  return _.map(values, value => ({
    x: new Date(value[0] * 1000),
    y: parseFloat(value[1]),
  }));
};

export const getInstantVectorStats: GetStats = (response, metric, formatY) => {
  const results = _.get(response, 'data.result', []);
  return results.map(r => {
    const y = _.get(r, 'value[1]');
    return {
      label: formatY ? formatY(y): null,
      x: _.get(r, ['metric', metric], ''),
      y,
    };
  });
};

export type GetStats = {
  (response: PrometheusResponse, metric?: string, formatY?: MutatorFunction): DataPoint[];
}
