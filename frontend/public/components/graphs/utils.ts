import * as _ from 'lodash-es';

import { PrometheusResponse } from '@console/shared/src/types/monitoring';

import { DataPoint } from '.';
import { Humanize } from '../utils';

export const getRangeVectorStats: GetStats<Date> = (response) => {
  const values = _.get(response, 'data.result[0].values');
  return _.map(values, (value) => ({
    x: new Date(value[0] * 1000),
    y: parseFloat(value[1]),
  }));
};

export const getInstantVectorStats: GetStats<number> = (response, metric, humanize) => {
  const results = _.get(response, 'data.result', []);
  return results.map((r) => {
    const y = parseFloat(_.get(r, 'value[1]'));
    return {
      label: humanize ? humanize(y).string : null,
      x: _.get(r, ['metric', metric], ''),
      y,
      metric: r.metric,
    };
  });
};

export type GetStats<X = Date | number | string> = {
  (response: PrometheusResponse, metric?: string, humanize?: Humanize): DataPoint<X>[];
};
