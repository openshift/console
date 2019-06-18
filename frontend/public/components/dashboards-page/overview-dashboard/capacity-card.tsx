import * as React from 'react';

import * as plugins from '../../../plugins';
import {
  DashboardCard,
  DashboardCardBody,
  DashboardCardHeader,
  DashboardCardTitle,
} from '../../dashboard/dashboard-card';
import { CapacityBody, CapacityItem } from '../../dashboard/capacity-card';
import { withDashboardResources, DashboardItemProps } from '../with-dashboard-resources';
import { humanizePercentage, humanizeDecimalBytesPerSec, humanizeBinaryBytesWithoutB } from '../../utils';
import { getInstantVectorStats, getRangeVectorStats, GetStats } from '../../graphs/utils';
import { CAPACITY_QUERY } from './capacity-query-types';

const defaultQueries = {
  [CAPACITY_QUERY.CPU_USED]: '((sum(node:node_cpu_utilisation:avg1m) / count(node:node_cpu_utilisation:avg1m)) * 100)[60m:5m]',
  [CAPACITY_QUERY.MEMORY_TOTAL]: 'sum(kube_node_status_capacity_memory_bytes)',
  [CAPACITY_QUERY.MEMORY_USED]: '(sum(kube_node_status_capacity_memory_bytes) - sum(kube_node_status_allocatable_memory_bytes))[60m:5m]',
  [CAPACITY_QUERY.STORAGE_TOTAL]: 'sum(node_filesystem_size_bytes)',
  [CAPACITY_QUERY.STORAGE_USED]: '(sum(node_filesystem_size_bytes) - sum(node_filesystem_free_bytes))[60m:5m]',
  [CAPACITY_QUERY.NETWORK_TOTAL]: 'sum(avg by(instance)(node_network_speed_bytes))',
  [CAPACITY_QUERY.NETWORK_USED]: 'sum(node:node_net_utilisation:sum_irate)',
};

const getLastStats = (response, getStats: GetStats): React.ReactText => {
  const stats = getStats(response);
  return stats.length > 0 ? stats[stats.length - 1].y : null;
};

const getQueries = () => {
  const pluginQueries = plugins.registry.getDashboardsOverviewCapacityQueries();
  const queries = {...defaultQueries};
  pluginQueries.forEach(pluginQuery => queries[pluginQuery.properties.queryKey] = pluginQuery.properties.query);
  return queries;
};

export const _CapacityCard: React.FC<DashboardItemProps> = ({
  watchPrometheus,
  stopWatchPrometheusQuery,
  prometheusResults,
}) => {
  React.useEffect(() => {
    const queries = getQueries();
    Object.keys(queries).forEach(key => watchPrometheus(queries[key]));
    return () => Object.keys(queries).forEach(key => stopWatchPrometheusQuery(queries[key]));
  }, [watchPrometheus, stopWatchPrometheusQuery]);

  const queries = getQueries();
  const cpuUtilization = prometheusResults.getIn([queries[CAPACITY_QUERY.CPU_USED], 'result']);
  const memoryUtilization = prometheusResults.getIn([queries[CAPACITY_QUERY.MEMORY_USED], 'result']);
  const memoryTotal = prometheusResults.getIn([queries[CAPACITY_QUERY.MEMORY_TOTAL], 'result']);
  const storageUsed = prometheusResults.getIn([queries[CAPACITY_QUERY.STORAGE_USED], 'result']);
  const storageTotal = prometheusResults.getIn([queries[CAPACITY_QUERY.STORAGE_TOTAL], 'result']);
  const networkUsed = prometheusResults.getIn([queries[CAPACITY_QUERY.NETWORK_USED], 'result']);
  const networkTotal = prometheusResults.getIn([queries[CAPACITY_QUERY.NETWORK_TOTAL], 'result']);

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Cluster Capacity</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <CapacityBody>
          <CapacityItem
            title="CPU"
            used={getLastStats(cpuUtilization, getRangeVectorStats)}
            total={100}
            formatValue={humanizePercentage}
            isLoading={!cpuUtilization}
          />
          <CapacityItem
            title="Memory"
            used={getLastStats(memoryUtilization, getRangeVectorStats)}
            total={getLastStats(memoryTotal, getInstantVectorStats)}
            formatValue={humanizeBinaryBytesWithoutB}
            isLoading={!(memoryUtilization && memoryTotal)}
          />
          <CapacityItem
            title="Storage"
            used={getLastStats(storageUsed, getRangeVectorStats)}
            total={getLastStats(storageTotal, getInstantVectorStats)}
            formatValue={humanizeBinaryBytesWithoutB}
            isLoading={!(storageUsed && storageTotal)}
          />
          <CapacityItem
            title="Network"
            used={getLastStats(networkUsed, getInstantVectorStats)}
            total={getLastStats(networkTotal, getInstantVectorStats)}
            formatValue={humanizeDecimalBytesPerSec}
            isLoading={!(networkUsed && networkTotal)}
          />
        </CapacityBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

export const CapacityCard = withDashboardResources(_CapacityCard);
