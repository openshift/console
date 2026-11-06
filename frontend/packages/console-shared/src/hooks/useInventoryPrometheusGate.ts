import { PrometheusEndpoint } from '@console/dynamic-plugin-sdk/src/api/common-types';
import { usePrometheusPoll } from '@console/internal/components/graphs/prometheus-poll-hook';
import { usePrometheusGate } from './usePrometheusGate';

// The minimal monitoring collection profile drops kube_namespace_status_phase along with the
// service, config map, and secret inventory metrics. Probing for it detects clusters where
// inventory counts cannot be served from Prometheus and must fall back to Kubernetes watches.
const getInventoryMetricsProbe = (namespace?: string) =>
  `count(kube_namespace_status_phase{job="kube-state-metrics"${
    namespace ? `,namespace=${JSON.stringify(namespace)}` : ''
  }} == 1)`;

/**
 * Like {@link usePrometheusGate}, but also verifies that the metrics used for inventory
 * counts are collected. Returns undefined while the probe is pending.
 */
export const useInventoryPrometheusGate = (namespace?: string): boolean | undefined => {
  const monitoringAvailable = usePrometheusGate();
  const [response, error, loading] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY,
    namespace,
    query: monitoringAvailable ? getInventoryMetricsProbe(namespace) : '',
  });
  if (!monitoringAvailable) {
    return false;
  }
  if (error) {
    return false;
  }
  if (loading || !response) {
    return undefined;
  }
  if (response.status !== 'success') {
    return false;
  }
  return response.data.result.length > 0;
};
