import * as _ from 'lodash';
import { Alert } from '@console/internal/components/monitoring';

export const filterNooBaaAlerts = (alerts: Alert[]): Alert[] =>
  alerts.filter((alert) => _.get(alert, 'annotations.storage_type') === 'NooBaa');

export const getPropsData = (data) => _.get(data, 'data.result[0].value[1]', null);

export const getMetric = (result: PrometheusMetricResult, metric: string): string =>
  _.get(result, ['metric', metric], null);

export const getValue = (result: PrometheusMetricResult): number => _.get(result, 'value[1]', null);

export type PrometheusMetricResult = {
  metric: { [key: string]: any };
  value?: [number, string | number];
};
