import * as _ from 'lodash-es';

export enum ProjectQueries {
  CPU_USAGE = 'CPU_USAGE',
  MEMORY_USAGE = 'MEMORY_USAGE',
  POD_COUNT = 'POD_COUNT',
  PODS_BY_CPU = 'PODS_BY_CPU',
  PODS_BY_MEMORY = 'PODS_BY_MEMORY',
}

const queries = {
  [ProjectQueries.CPU_USAGE]: _.template(
    `namespace:container_cpu_usage:sum{namespace='<%= project %>'}<%= duration %>`,
  ),
  [ProjectQueries.MEMORY_USAGE]: _.template(
    `sum by(namespace) (container_memory_working_set_bytes{namespace='<%= project %>',container="",pod!=""})<%= duration %>`,
  ),
  [ProjectQueries.POD_COUNT]: _.template(
    `count(kube_pod_info{namespace='<%= project %>'}) by (namespace)<%= duration %>`,
  ),
};

const top25Queries = {
  [ProjectQueries.PODS_BY_CPU]: _.template(
    `topk(25, sort_desc(sum(rate(container_cpu_usage_seconds_total{container="",pod!="",namespace='<%= project %>'}[5m])) BY (pod, namespace)))`,
  ),
  [ProjectQueries.PODS_BY_MEMORY]: _.template(
    `topk(25, sort_desc(sum(container_memory_working_set_bytes{container="",pod!="",namespace='<%= project %>'}) BY (pod, namespace)))`,
  ),
};

export const getUtilizationQueries = (project: string, duration: string) => ({
  [ProjectQueries.CPU_USAGE]: queries[ProjectQueries.CPU_USAGE]({ project, duration }),
  [ProjectQueries.MEMORY_USAGE]: queries[ProjectQueries.MEMORY_USAGE]({ project, duration }),
  [ProjectQueries.POD_COUNT]: queries[ProjectQueries.POD_COUNT]({ project, duration }),
});

export const getTopConsumerQueries = (project: string) => ({
  [ProjectQueries.PODS_BY_CPU]: top25Queries[ProjectQueries.PODS_BY_CPU]({ project }),
  [ProjectQueries.PODS_BY_MEMORY]: top25Queries[ProjectQueries.PODS_BY_MEMORY]({ project }),
});
