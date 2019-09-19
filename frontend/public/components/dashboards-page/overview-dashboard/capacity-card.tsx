import * as React from 'react';
import * as _ from 'lodash-es';
import { Grid, GridItem } from '@patternfly/react-core';

import * as plugins from '../../../plugins';
import {
  DashboardCard,
  DashboardCardBody,
  DashboardCardHeader,
  DashboardCardTitle,
} from '../../dashboard/dashboard-card';
import { CapacityBody, CapacityItem } from '../../dashboard/capacity-card';
import { withDashboardResources, DashboardItemProps } from '../with-dashboard-resources';
import { humanizePercentage, humanizeDecimalBytesPerSec, humanizeBinaryBytesWithoutB, useRefWidth } from '../../utils';
import { getInstantVectorStats, getRangeVectorStats, GetStats } from '../../graphs/utils';
import { OverviewQuery, capacityQueries } from './queries';
import { connectToFlags, FlagsObject, WithFlagsProps } from '../../../reducers/features';
import { getFlagsForExtensions, isDashboardExtensionInUse } from '../utils';

const getLastStats = (response, getStats: GetStats): React.ReactText => {
  const stats = getStats(response);
  return stats.length > 0 ? stats[stats.length - 1].y : null;
};

const getQueries = (flags: FlagsObject) => {
  const pluginQueries = {};
  plugins.registry.getDashboardsOverviewQueries().filter(e => isDashboardExtensionInUse(e, flags)).forEach(pluginQuery => {
    const queryKey = pluginQuery.properties.queryKey;
    if (!pluginQueries[queryKey]) {
      pluginQueries[queryKey] = pluginQuery.properties.query;
    }
  });
  return _.defaults(pluginQueries, capacityQueries);
};

export const CapacityCard_: React.FC<DashboardItemProps & WithFlagsProps> = ({
  watchPrometheus,
  stopWatchPrometheusQuery,
  prometheusResults,
  flags = {},
}) => {
  const [containerRef, width] = useRefWidth();
  React.useEffect(() => {
    const queries = getQueries(flags);
    Object.keys(queries).forEach(key => watchPrometheus(queries[key]));
    return () => Object.keys(queries).forEach(key => stopWatchPrometheusQuery(queries[key]));
    // TODO: to be removed: use JSON.stringify(flags) to avoid deep comparison of flags object
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchPrometheus, stopWatchPrometheusQuery, JSON.stringify(flags)]);

  const queries = getQueries(flags);
  const cpuUtilization = prometheusResults.getIn([queries[OverviewQuery.CPU_UTILIZATION], 'data']);
  const cpuUtilizationError = prometheusResults.getIn([queries[OverviewQuery.CPU_UTILIZATION], 'loadError']);
  const memoryUtilization = prometheusResults.getIn([queries[OverviewQuery.MEMORY_UTILIZATION], 'data']);
  const memoryUtilizationError = prometheusResults.getIn([queries[OverviewQuery.MEMORY_UTILIZATION], 'loadError']);
  const memoryTotal = prometheusResults.getIn([queries[OverviewQuery.MEMORY_TOTAL], 'data']);
  const memoryTotalError = prometheusResults.getIn([queries[OverviewQuery.MEMORY_TOTAL], 'loadError']);
  const storageUsed = prometheusResults.getIn([queries[OverviewQuery.STORAGE_UTILIZATION], 'data']);
  const storageUsedError = prometheusResults.getIn([queries[OverviewQuery.STORAGE_UTILIZATION], 'loadError']);
  const storageTotal = prometheusResults.getIn([queries[OverviewQuery.STORAGE_TOTAL], 'data']);
  const storageTotalError = prometheusResults.getIn([queries[OverviewQuery.STORAGE_TOTAL], 'loadError']);
  const networkUsed = prometheusResults.getIn([queries[OverviewQuery.NETWORK_UTILIZATION], 'data']);
  const networkUsedError = prometheusResults.getIn([queries[OverviewQuery.NETWORK_UTILIZATION], 'loadError']);
  const networkTotal = prometheusResults.getIn([queries[OverviewQuery.NETWORK_TOTAL], 'data']);
  const networkTotalError = prometheusResults.getIn([queries[OverviewQuery.NETWORK_TOTAL], 'loadError']);

  const CPUItem = (
    <CapacityItem
      title="CPU"
      used={getLastStats(cpuUtilization, getRangeVectorStats)}
      total={100}
      formatValue={humanizePercentage}
      isLoading={!cpuUtilization}
      error={cpuUtilizationError}
    />
  );

  const MemoryItem = (
    <CapacityItem
      title="Memory"
      used={getLastStats(memoryUtilization, getRangeVectorStats)}
      total={getLastStats(memoryTotal, getInstantVectorStats)}
      formatValue={humanizeBinaryBytesWithoutB}
      isLoading={!(memoryUtilization && memoryTotal)}
      error={memoryUtilizationError || memoryTotalError}
    />
  );

  const StorageItem = (
    <CapacityItem
      title="Storage"
      used={getLastStats(storageUsed, getRangeVectorStats)}
      total={getLastStats(storageTotal, getInstantVectorStats)}
      formatValue={humanizeBinaryBytesWithoutB}
      isLoading={!(storageUsed && storageTotal)}
      error={storageUsedError || storageTotalError}
    />
  );

  const NetworkItem = (
    <CapacityItem
      title="Network"
      used={getLastStats(networkUsed, getInstantVectorStats)}
      total={getLastStats(networkTotal, getInstantVectorStats)}
      formatValue={humanizeDecimalBytesPerSec}
      isLoading={!(networkUsed && networkTotal)}
      error={networkUsedError || networkTotalError}
    />
  );


  let grid;
  if (width <= 300) {
    grid = (
      <>
        <GridItem className="co-overview-capacity__item">
          {CPUItem}
        </GridItem>
        <GridItem className="co-overview-capacity__item">
          {MemoryItem}
        </GridItem>
        <GridItem className="co-overview-capacity__item">
          {StorageItem}
        </GridItem>
        <GridItem className="co-overview-capacity__item">
          {NetworkItem}
        </GridItem>
      </>
    );
  } else if (width <= 650) {
    grid = (
      <>
        <GridItem className="co-overview-capacity__item">
          {CPUItem}
          {MemoryItem}
        </GridItem>
        <GridItem className="co-overview-capacity__item">
          {StorageItem}
          {NetworkItem}
        </GridItem>
      </>
    );
  } else {
    grid = (
      <>
        <GridItem className="co-overview-capacity__item">
          {CPUItem}
          {MemoryItem}
          {StorageItem}
          {NetworkItem}
        </GridItem>
      </>
    );
  }
  return (
    <div ref={containerRef}>
      <DashboardCard>
        <DashboardCardHeader>
          <DashboardCardTitle>Cluster Capacity</DashboardCardTitle>
        </DashboardCardHeader>
        <DashboardCardBody>
          <CapacityBody>
            <Grid className="co-overview-capacity__grid">{grid}</Grid>
          </CapacityBody>
        </DashboardCardBody>
      </DashboardCard>
    </div>
  );
};

export const CapacityCard = connectToFlags(
  ...getFlagsForExtensions(plugins.registry.getDashboardsOverviewQueries()),
)(withDashboardResources(CapacityCard_));
