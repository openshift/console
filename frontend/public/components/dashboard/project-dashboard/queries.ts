import * as _ from 'lodash-es';

export enum ProjectQueries {
  CPU_USAGE = 'CPU_USAGE',
  MEMORY_USAGE = 'MEMORY_USAGE',
  POD_COUNT = 'POD_COUNT',
  FILESYSTEM_USAGE = 'FILESYSTEM_USAGE',
  NETWORK_IN = 'NETWORK_IN',
  NETWORK_OUT = 'NETWORK_OUT',
  NETWORK = 'NETWORK',
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
  [ProjectQueries.FILESYSTEM_USAGE]: _.template(
    `(sum(node_filesystem_size_bytes{namespace='<%= project %>'}) - sum(node_filesystem_free_bytes{namespace='<%= project %>'}))<%= duration %>`,
  ),

  [ProjectQueries.NETWORK_IN]: _.template(
    `(sum(instance:node_network_receive_bytes_excluding_lo:rate1m{namespace='<%= project %>'}))<%= duration %>`,
  ),
  [ProjectQueries.NETWORK_OUT]: _.template(
    `(sum(instance:node_network_transmit_bytes_excluding_lo:rate1m{namespace='<%= project %>'}))<%= duration %>`,
  ),
};

const linkableQueries = {
  [ProjectQueries.NETWORK]: _.template(
    `sum({ __name__=~"instance:node_network_receive_bytes_excluding_lo:rate1m|instance:node_network_transmit_bytes_excluding_lo:rate1m", namespace='<%= project %>' }) by(__name__)`,
  ),
};

export const getUtilizationQueries = (project: string, duration: string) => ({
  [ProjectQueries.CPU_USAGE]: queries[ProjectQueries.CPU_USAGE]({ project, duration }),
  [ProjectQueries.MEMORY_USAGE]: queries[ProjectQueries.MEMORY_USAGE]({ project, duration }),
  [ProjectQueries.POD_COUNT]: queries[ProjectQueries.POD_COUNT]({ project, duration }),
  [ProjectQueries.FILESYSTEM_USAGE]: queries[ProjectQueries.FILESYSTEM_USAGE]({
    project,
    duration,
  }),
  [ProjectQueries.NETWORK_IN]: queries[ProjectQueries.NETWORK_IN]({ project, duration }),
  [ProjectQueries.NETWORK_OUT]: queries[ProjectQueries.NETWORK_OUT]({ project, duration }),
});

export const getLinkableQueries = (project: string) => ({
  [ProjectQueries.NETWORK]: linkableQueries[ProjectQueries.NETWORK]({ project }),
});
