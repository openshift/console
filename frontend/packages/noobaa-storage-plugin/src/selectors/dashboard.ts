import * as _ from 'lodash';
import { Alert } from '@console/internal/components/monitoring';
import { PrometheusResponse } from '@console/internal/components/graphs';

export const filterNooBaaAlerts = (alerts: Alert[]): Alert[] =>
  alerts.filter((alert) => _.get(alert, 'annotations.storage_type') === 'NooBaa');

export const getGaugeValue = (data) => _.get(data, 'data.result[0].value[1]', null);

export const getMetric = (result: PrometheusResponse, metric: string): string =>
  _.get(result, ['data', 'result', '0', 'metric', metric], null);

export const getValue = (result: PrometheusMetricResult): number => _.get(result, 'value[1]', null);

export type PrometheusMetricResult = {
  metric: { [key: string]: any };
  value?: [number, string | number];
};
