import * as React from 'react';
import * as _ from 'lodash-es';

import * as plugins from '../../../plugins';
import {
  DashboardCard,
  DashboardCardBody,
  DashboardCardHeader,
  DashboardCardTitle,
} from '../../dashboard/dashboard-card';
import { UtilizationItem, UtilizationBody } from '../../dashboard/utilization-card';
import { DashboardItemProps, withDashboardResources } from '../with-dashboard-resources';
import { getRangeVectorStats } from '../../graphs/utils';
import { humanizePercentage, humanizeBinaryBytesWithoutB } from '../../utils';
import { OverviewQuery, utilizationQueries } from './queries';

const getQueries = () => {
  const pluginQueries = {};
  plugins.registry.getDashboardsOverviewQueries().forEach(pluginQuery => {
    const queryKey = pluginQuery.properties.queryKey;
    if (!pluginQueries[queryKey]) {
      pluginQueries[queryKey] = pluginQuery.properties.query;
    }
  });
  return _.defaults(pluginQueries, utilizationQueries);
};

const UtilizationCard_: React.FC<DashboardItemProps> = ({
  watchPrometheus,
  stopWatchPrometheusQuery,
  prometheusResults,
}) => {
  React.useEffect(() => {
    const queries = getQueries();
    Object.keys(queries).forEach(key => watchPrometheus(queries[key]));

    const pluginItems = plugins.registry.getDashboardsOverviewUtilizationItems();
    pluginItems.forEach(item => watchPrometheus(item.properties.query));
    return () => {
      Object.keys(queries).forEach(key => stopWatchPrometheusQuery(queries[key]));
      pluginItems.forEach(item => stopWatchPrometheusQuery(item.properties.query));
    };
  }, [watchPrometheus, stopWatchPrometheusQuery]);

  const queries = getQueries();
  const cpuUtilization = prometheusResults.getIn([queries[OverviewQuery.CPU_UTILIZATION], 'result']);
  const memoryUtilization = prometheusResults.getIn([queries[OverviewQuery.MEMORY_UTILIZATION], 'result']);
  const storageUtilization = prometheusResults.getIn([queries[OverviewQuery.STORAGE_UTILIZATION], 'result']);

  const cpuStats = getRangeVectorStats(cpuUtilization);
  const memoryStats = getRangeVectorStats(memoryUtilization);
  const storageStats = getRangeVectorStats(storageUtilization);

  const pluginItems = plugins.registry.getDashboardsOverviewUtilizationItems();

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Cluster Utilization</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <UtilizationBody timestamps={cpuStats.map(stat => stat.x as Date)}>
          <UtilizationItem
            title="CPU"
            data={cpuStats}
            isLoading={!cpuUtilization}
            humanizeValue={humanizePercentage}
            query={queries[OverviewQuery.CPU_UTILIZATION]}
          />
          <UtilizationItem
            title="Memory"
            data={memoryStats}
            isLoading={!(memoryUtilization)}
            humanizeValue={humanizeBinaryBytesWithoutB}
            query={queries[OverviewQuery.MEMORY_UTILIZATION]}
          />
          <UtilizationItem
            title="Disk Usage"
            data={storageStats}
            isLoading={!(storageUtilization)}
            humanizeValue={humanizeBinaryBytesWithoutB}
            query={queries[OverviewQuery.STORAGE_UTILIZATION]}
          />
          {pluginItems.map(({ properties }, index) => {
            const utilization = prometheusResults.getIn([properties.query, 'result']);
            const utilizationStats = getRangeVectorStats(utilization);
            return (
              <UtilizationItem
                key={index}
                title={properties.title}
                data={utilizationStats}
                isLoading={!utilization}
                humanizeValue={properties.humanizeValue}
                query={properties.query}
              />
            );
          })}
        </UtilizationBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

export const UtilizationCard = withDashboardResources(UtilizationCard_);
