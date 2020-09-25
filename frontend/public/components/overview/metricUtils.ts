import * as _ from 'lodash';
import { PROMETHEUS_TENANCY_BASE_PATH } from '../graphs';
import { coFetchJSON } from '../../co-fetch';
import { getAlertsAndRules } from '../monitoring/utils';
import { Alert } from '../monitoring/types';
import { getPrometheusURL, PrometheusEndpoint } from '../graphs/helpers';

export type MetricValuesByPod = {
  [podName: string]: number;
};

export type OverviewMetrics = {
  cpu?: MetricValuesByPod;
  memory?: MetricValuesByPod;
};

// Return codes indicating no retry
export const METRICS_FAILURE_CODES = [401, 403, 502, 503];

export const fetchOverviewMetrics = (
  namespace: string,
): Promise<{ [key: string]: MetricValuesByPod }> => {
  if (!PROMETHEUS_TENANCY_BASE_PATH) {
    return Promise.resolve(null);
  }

  const queries = {
    memory: `sum(container_memory_working_set_bytes{namespace='${namespace}',container='',pod!=''}) BY (pod, namespace)`,
    cpu: `pod:container_cpu_usage:sum{namespace="${namespace}"}`,
  };

  const promises = _.map(queries, (query, name) => {
    const url = `${PROMETHEUS_TENANCY_BASE_PATH}/api/v1/query?namespace=${namespace}&query=${encodeURIComponent(
      query,
    )}`;
    return coFetchJSON(url).then(({ data: { result } }) => {
      const byPod: MetricValuesByPod = result.reduce((acc, { metric, value }) => {
        acc[metric.pod] = Number(value[1]);
        return acc;
      }, {});
      return { [name]: byPod };
    });
  });

  return Promise.all(promises).then((data) => {
    return data.reduce(
      (acc: OverviewMetrics, metric): OverviewMetrics => _.assign(acc, metric),
      {},
    );
  });
};

export const fetchMonitoringAlerts = (namespace: string): Promise<Alert[]> => {
  if (!PROMETHEUS_TENANCY_BASE_PATH) {
    return Promise.resolve(null);
  }
  const url = getPrometheusURL({
    endpoint: PrometheusEndpoint.RULES,
    namespace,
    query: `namespace=${namespace}`,
  });
  return coFetchJSON(url).then(({ data }) => {
    const { alerts } = getAlertsAndRules(data);
    return alerts;
  });
};
