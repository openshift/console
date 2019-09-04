import * as _ from 'lodash-es';

export enum ProjectQueries {
  CPU_USAGE = 'CPU_USAGE',
  MEMORY_USAGE = 'MEMORY_USAGE',
  POD_COUNT = 'POD_COUNT',
}

const queries = {
  [ProjectQueries.CPU_USAGE]: _.template(
    `namespace:container_cpu_usage:sum{namespace='<%= project %>'}[60m:5m]`,
  ),
  [ProjectQueries.MEMORY_USAGE]: _.template(
    `sum by(namespace) (container_memory_working_set_bytes{namespace='<%= project %>',container="",pod!=""})[60m:5m]`,
  ),
  [ProjectQueries.POD_COUNT]: _.template(
    `count(kube_pod_info{namespace='<%= project %>'}) by (namespace)[60m:5m]`,
  ),
};

export const getUtilizationQueries = (project: string) => ({
  [ProjectQueries.CPU_USAGE]: queries[ProjectQueries.CPU_USAGE]({ project }),
  [ProjectQueries.MEMORY_USAGE]: queries[ProjectQueries.MEMORY_USAGE]({ project }),
  [ProjectQueries.POD_COUNT]: queries[ProjectQueries.POD_COUNT]({ project }),
});
