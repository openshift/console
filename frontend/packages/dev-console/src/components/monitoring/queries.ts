import * as _ from 'lodash';

export const metricsQuery = {
  PODS_BY_CPU: 'PODS_BY_CPU',
  PODS_BY_MEMORY: 'PODS_BY_MEMORY',
  PODS_BY_FILESYSTEM: 'PODS_BY_FILESYSTEM',
  PODS_BY_NETWORK: 'PODS_BY_NETWORK',
};

const topMetricsQueries = {
  [metricsQuery.PODS_BY_CPU]: _.template(
    `topk(25, sort_desc(sum(avg_over_time(pod:container_cpu_usage:sum{container="",pod!="",namespace='<%= project %>'}[5m])) BY (pod, namespace)))`,
  ),
  [metricsQuery.PODS_BY_MEMORY]: _.template(
    `topk(25, sort_desc(sum(avg_over_time(container_memory_working_set_bytes{container="",pod!="",namespace='<%= project %>'}[5m])) BY (pod, namespace)))`,
  ),
  [metricsQuery.PODS_BY_FILESYSTEM]: _.template(
    `topk(25, sort_desc(sum(pod:container_fs_usage_bytes:sum{container="",pod!="",namespace='<%= project %>'}) BY (pod, namespace)))`,
  ),
  [metricsQuery.PODS_BY_NETWORK]: _.template(
    `topk(25, sort_desc(sum(rate(container_network_receive_bytes_total{ container="POD", pod!= "", namespace = '<%= project %>'}[5m]) + rate(container_network_transmit_bytes_total{ container="POD", pod!= "", namespace = '<%= project %>'}[5m])) BY (namespace, pod)))`,
  ),
};

export const getTopMetricsQueries = (project: string) => ({
  [metricsQuery.PODS_BY_CPU]: topMetricsQueries[metricsQuery.PODS_BY_CPU]({ project }),
  [metricsQuery.PODS_BY_MEMORY]: topMetricsQueries[metricsQuery.PODS_BY_MEMORY]({ project }),
  [metricsQuery.PODS_BY_FILESYSTEM]: topMetricsQueries[metricsQuery.PODS_BY_FILESYSTEM]({
    project,
  }),
  [metricsQuery.PODS_BY_NETWORK]: topMetricsQueries[metricsQuery.PODS_BY_NETWORK]({ project }),
});
