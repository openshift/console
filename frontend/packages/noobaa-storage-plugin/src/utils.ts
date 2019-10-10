import * as _ from 'lodash';
import { Alert } from '@console/internal/components/monitoring';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { MAX_PROGRESS } from './constants';

export const filterNooBaaAlerts = (alerts: Alert[]): Alert[] =>
  alerts.filter((alert) => _.get(alert, 'annotations.storage_type') === 'NooBaa');

export const getGaugeValue = (data) => _.get(data, 'data.result[0].value[1]');

export const getMetric = (result: PrometheusResponse, metric: string): string =>
  _.get(result, ['data', 'result', '0', 'metric', metric], null);

export const getValue = (result: PrometheusMetricResult): number => _.get(result, 'value[1]', null);

export type PrometheusMetricResult = {
  metric: { [key: string]: any };
  value?: [number, string | number];
};

export const getOBCPhase = (obc: K8sResourceKind): string => {
  const phase: string = _.get(obc, 'status.Phase');
  return phase ? phase.charAt(0).toUpperCase() + phase.substring(1) : 'Lost';
};

/** NooBaa issue currently no status is shown  */
export const isBound = (obc: K8sResourceKind): boolean => getOBCPhase(obc) === 'Bound';

export const getOBPhase = (ob: K8sResourceKind): string => {
  const phase: string = _.get(ob, 'status.phase');
  return phase ? phase.charAt(0).toUpperCase() + phase.substring(1) : 'Lost';
};

export const isDataResiliencyActivity = (response: PrometheusResponse): boolean => {
  const progress = getGaugeValue(response);
  return progress < MAX_PROGRESS;
};
