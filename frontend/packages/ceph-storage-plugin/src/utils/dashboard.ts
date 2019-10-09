import * as _ from 'lodash';
import { PrometheusResponse } from '@console/internal/components/graphs';

export const getResiliencyProgress = (results: PrometheusResponse): number => {
  const progress = _.get(results, 'data.result[0].value[1]');
  //  Zero PG Case
  if (Number.isNaN(progress)) {
    return null;
  }
  return Number((Number(progress) * 100).toFixed(1));
};
