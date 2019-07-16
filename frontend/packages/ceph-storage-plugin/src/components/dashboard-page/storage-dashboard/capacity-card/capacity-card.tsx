import * as React from 'react';

import {
  DashboardCard,
  DashboardCardBody,
  DashboardCardHeader,
  DashboardCardTitle,
} from '@console/internal/components/dashboard/dashboard-card';
import { CapacityBody, CapacityItem } from '@console/internal/components/dashboard/capacity-card';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboards-page/with-dashboard-resources';
import { humanizeBinaryBytesWithoutB } from '@console/internal/components/utils';
import {
  getInstantVectorStats,
  getRangeVectorStats,
  GetStats,
} from '@console/internal/components/graphs/utils';
import { StorageDashboardQuery, CAPACITY_USAGE_QUERIES } from '../../../../constants/queries';

const getLastStats = (response, getStats: GetStats): React.ReactText => {
  const stats = getStats(response);
  return stats.length > 0 ? stats[stats.length - 1].y : null;
};

export const CapacityCard: React.FC<DashboardItemProps> = ({
  watchPrometheus,
  stopWatchPrometheusQuery,
  prometheusResults,
}) => {
  React.useEffect(() => {
    Object.keys(CAPACITY_USAGE_QUERIES).forEach((key) =>
      watchPrometheus(CAPACITY_USAGE_QUERIES[key]),
    );
    return () =>
      Object.keys(CAPACITY_USAGE_QUERIES).forEach((key) =>
        stopWatchPrometheusQuery(CAPACITY_USAGE_QUERIES[key]),
      );
  }, [watchPrometheus, stopWatchPrometheusQuery]);

  const storageUsed = prometheusResults.getIn([
    CAPACITY_USAGE_QUERIES[StorageDashboardQuery.CEPH_CAPACITY_USED],
    'result',
  ]);
  const storageTotal = prometheusResults.getIn([
    CAPACITY_USAGE_QUERIES[StorageDashboardQuery.CEPH_CAPACITY_TOTAL],
    'result',
  ]);
  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Capacity</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <CapacityBody>
          <CapacityItem
            title="Storage"
            used={getLastStats(storageUsed, getRangeVectorStats)}
            total={getLastStats(storageTotal, getInstantVectorStats)}
            formatValue={humanizeBinaryBytesWithoutB}
            isLoading={!(storageUsed && storageTotal)}
          />
        </CapacityBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default withDashboardResources(CapacityCard);
