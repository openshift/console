import * as React from 'react';
import * as _ from 'lodash-es';

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
import { OverviewQuery, capacityQueries } from './queries';

const getLastStats = (response, getStats: GetStats): React.ReactText => {
  const stats = getStats(response);
  return stats.length > 0 ? stats[stats.length - 1].y : null;
};

const getQueries = () => {
  const pluginQueries = {};
  plugins.registry.getDashboardsOverviewQueries().forEach(pluginQuery => {
    const queryKey = pluginQuery.properties.queryKey;
    if (!pluginQueries[queryKey]) {
      pluginQueries[queryKey] = pluginQuery.properties.query;
    }
  });
  return _.defaults(pluginQueries, capacityQueries);
};

export const CapacityCard_: React.FC<DashboardItemProps> = ({
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
  const cpuUtilization = prometheusResults.getIn([queries[OverviewQuery.CPU_UTILIZATION], 'result']);
  const memoryUtilization = prometheusResults.getIn([queries[OverviewQuery.MEMORY_UTILIZATION], 'result']);
  const memoryTotal = prometheusResults.getIn([queries[OverviewQuery.MEMORY_TOTAL], 'result']);
  const storageUsed = prometheusResults.getIn([queries[OverviewQuery.STORAGE_UTILIZATION], 'result']);
  const storageTotal = prometheusResults.getIn([queries[OverviewQuery.STORAGE_TOTAL], 'result']);
  const networkUsed = prometheusResults.getIn([queries[OverviewQuery.NETWORK_UTILIZATION], 'result']);
  const networkTotal = prometheusResults.getIn([queries[OverviewQuery.NETWORK_TOTAL], 'result']);

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

export const CapacityCard = withDashboardResources(CapacityCard_);
