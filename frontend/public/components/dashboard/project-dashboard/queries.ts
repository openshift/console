import * as _ from 'lodash-es';

export enum ProjectQueries {
  CPU_USAGE = 'CPU_USAGE',
  MEMORY_USAGE = 'MEMORY_USAGE',
  POD_COUNT = 'POD_COUNT',
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

export const getUtilizationQueries = (project: string, duration: string) => ({
  [ProjectQueries.CPU_USAGE]: queries[ProjectQueries.CPU_USAGE]({ project, duration }),
  [ProjectQueries.MEMORY_USAGE]: queries[ProjectQueries.MEMORY_USAGE]({ project, duration }),
  [ProjectQueries.POD_COUNT]: queries[ProjectQueries.POD_COUNT]({ project, duration }),
});
