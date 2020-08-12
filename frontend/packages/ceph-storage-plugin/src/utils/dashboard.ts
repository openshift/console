import * as _ from 'lodash';
import { PrometheusResponse } from '@console/internal/components/graphs';

export const getGaugeValue = (data: PrometheusResponse): string =>
  _.get(data, 'data.result[0].value[1]');
