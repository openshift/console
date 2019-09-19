import * as React from 'react';
import * as plugins from '@console/internal/plugins';
import { connectToFlags, FlagsObject, WithFlagsProps } from '@console/internal/reducers/features';
import { getFlagsForExtensions } from '@console/internal/components/dashboards-page/utils';
import { CapacityBody, CapacityItem } from '@console/internal/components/dashboard/capacity-card';
import {
  DashboardCard,
  DashboardCardBody,
  DashboardCardHeader,
  DashboardCardTitle,
  DashboardCardHelp,
} from '@console/internal/components/dashboard/dashboard-card';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboards-page/with-dashboard-resources';
import { DashboardsStorageCapacityDropdownItem } from '@console/plugin-sdk';
import { Dropdown, humanizeBinaryBytesWithoutB } from '@console/internal/components/utils';
import { getInstantVectorStats, GetStats } from '@console/internal/components/graphs/utils';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { StorageDashboardQuery, CAPACITY_USAGE_QUERIES } from '../../../../constants/queries';
import './capacity-card.scss';

const getLastStats = (response, getStats: GetStats): React.ReactText => {
  const stats = getStats(response);
  return stats.length > 0 ? stats[stats.length - 1].y : null;
};

const CapacityViewType = {
  CAPACITY_TOTAL_USAGE: 'Total Capacity',
  CAPACITY_REQUESTED_VS_USED: 'Requested vs Used',
};

const cvtFirstKey = Object.keys(CapacityViewType)[0];

// maps the TOTAL and USED queries to a single 'CapacityViewType'
const QueriesMatchingCapacityView: QueryMapType = {
  [CapacityViewType.CAPACITY_TOTAL_USAGE]: [
    CAPACITY_USAGE_QUERIES[StorageDashboardQuery.CEPH_CAPACITY_TOTAL],
    CAPACITY_USAGE_QUERIES[StorageDashboardQuery.CEPH_CAPACITY_USED],
  ],
  [CapacityViewType.CAPACITY_REQUESTED_VS_USED]: [
    CAPACITY_USAGE_QUERIES[StorageDashboardQuery.STORAGE_CEPH_CAPACITY_REQUESTED_QUERY],
    CAPACITY_USAGE_QUERIES[StorageDashboardQuery.STORAGE_CEPH_CAPACITY_USED_QUERY],
  ],
};

const getItems = (plugin: DashboardsStorageCapacityDropdownItem[], flags: FlagsObject) =>
  plugin.filter((e) => flags[e.properties.required]);

const getCapacityQueries = (flags: FlagsObject) => {
  const capacityQueries = { ...QueriesMatchingCapacityView };
  getItems(plugins.registry.getDashboardsStorageCapacityDropdownItem(), flags).forEach(
    (pluginItem) => {
      if (!capacityQueries[pluginItem.properties.metric]) {
        capacityQueries[pluginItem.properties.metric] = pluginItem.properties.queries;
        CapacityViewType[pluginItem.properties.metric] = pluginItem.properties.metric;
      }
    },
  );
  return capacityQueries;
};

export const CapacityCard: React.FC<DashboardItemProps & WithFlagsProps> = ({
  watchPrometheus,
  stopWatchPrometheusQuery,
  prometheusResults,
  flags = {},
}) => {
  const [cvTypeSelected, setCapacityViewType] = React.useState(cvtFirstKey);

  React.useEffect(() => {
    const capacityQueries = getCapacityQueries(flags);
    // 'matchingQueries' variable will contain both [TOTAL, USED] queries
    const matchingQueries = capacityQueries[CapacityViewType[cvTypeSelected]];
    // watch both the variables
    matchingQueries.forEach((mq) => {
      watchPrometheus(mq);
    });
    return () =>
      matchingQueries.forEach((mq) => {
        stopWatchPrometheusQuery(mq);
      });
    // TODO: to be removed: use JSON.stringify(flags) to avoid deep comparison of flags object
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchPrometheus, stopWatchPrometheusQuery, cvTypeSelected, JSON.stringify(flags)]);

  const capacityQueries = getCapacityQueries(flags);
  const matchingQueries = capacityQueries[CapacityViewType[cvTypeSelected]];
  // 'matchingQueries[0] => TOTAL query
  // 'matchingQueries[1] => USED query
  const storageTotal = prometheusResults.getIn([matchingQueries[0], 'data']) as PrometheusResponse;
  const storageTotalError = prometheusResults.getIn([matchingQueries[0], 'loadError']);
  const storageUsed = prometheusResults.getIn([matchingQueries[1], 'data']) as PrometheusResponse;
  const storageUsedError = prometheusResults.getIn([matchingQueries[1], 'loadError']);

  const statUsed: React.ReactText = getLastStats(storageUsed, getInstantVectorStats);
  const statTotal: React.ReactText = getLastStats(storageTotal, getInstantVectorStats);
  const infoText =
    'Capacity includes the capacity being used to store user data and overhead from ensuring redundancy and reliability of the data.';

  return (
    <DashboardCard className="ceph-capacity-card__dashboard-card">
      <DashboardCardHeader>
        <DashboardCardTitle>Capacity</DashboardCardTitle>
        <div className="ceph-capacity-card__tootip-dropdown">
          <Dropdown
            items={CapacityViewType}
            onChange={setCapacityViewType}
            selectedKey={[cvTypeSelected]}
          />
          <DashboardCardHelp>{infoText}</DashboardCardHelp>
        </div>
      </DashboardCardHeader>
      <DashboardCardBody>
        <CapacityBody>
          <CapacityItem
            title="Storage"
            used={statUsed}
            total={statTotal}
            error={storageTotalError || storageUsedError}
            formatValue={humanizeBinaryBytesWithoutB}
            isLoading={!(storageUsed && storageTotal)}
          />
        </CapacityBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default connectToFlags(
  ...getFlagsForExtensions(plugins.registry.getDashboardsStorageCapacityDropdownItem()),
)(withDashboardResources(CapacityCard));

export type QueryMapType = {
  [queryType: string]: [string, string];
};
