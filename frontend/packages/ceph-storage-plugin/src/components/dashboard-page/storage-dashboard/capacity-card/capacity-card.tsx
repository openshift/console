import * as React from 'react';
import { CapacityBody, CapacityItem } from '@console/internal/components/dashboard/capacity-card';
import {
  DashboardCard,
  DashboardCardBody,
  DashboardCardHeader,
  DashboardCardTitle,
} from '@console/internal/components/dashboard/dashboard-card';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboards-page/with-dashboard-resources';
import { Dropdown, humanizeBinaryBytesWithoutB } from '@console/internal/components/utils';
import {
  getInstantVectorStats,
  getRangeVectorStats,
  GetStats,
} from '@console/internal/components/graphs/utils';
import { StorageDashboardQuery, CAPACITY_USAGE_QUERIES } from '../../../../constants/queries';
import './capacity-card.scss';

const getLastStats = (response, getStats: GetStats): React.ReactText => {
  const stats = getStats(response);
  return stats.length > 0 ? stats[stats.length - 1].y : null;
};

enum CapacityViewType {
  CAPACITY_TOTAL_USAGE = 'Total Capacity',
  CAPACITY_REQUESTED_VS_USED = 'Requested vs Used',
  CAPACITY_VMS_VS_PODS = 'VMs vs Pods',
}

const cvtFirstKey = Object.keys(CapacityViewType)[0];

type QueryMapType = {
  [queryType: string]: [string, string];
};

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
  [CapacityViewType.CAPACITY_VMS_VS_PODS]: [
    CAPACITY_USAGE_QUERIES[StorageDashboardQuery.STORAGE_CEPH_CAPACITY_PODS_QUERY],
    CAPACITY_USAGE_QUERIES[StorageDashboardQuery.STORAGE_CEPH_CAPACITY_VMS_QUERY],
  ],
};

export const CapacityCard: React.FC<DashboardItemProps> = ({
  watchPrometheus,
  stopWatchPrometheusQuery,
  prometheusResults,
}) => {
  const [cvTypeSelected, setCapacityViewType] = React.useState(cvtFirstKey);

  React.useEffect(() => {
    // 'matchingQueries' variable will contain both [TOTAL, USED] queries
    const matchingQueries = QueriesMatchingCapacityView[CapacityViewType[cvTypeSelected]];
    // watch both the variables
    matchingQueries.forEach((mq) => {
      watchPrometheus(mq);
    });
    return () =>
      matchingQueries.forEach((mq) => {
        stopWatchPrometheusQuery(mq);
      });
  }, [watchPrometheus, stopWatchPrometheusQuery, cvTypeSelected]);

  const matchingQueries = QueriesMatchingCapacityView[CapacityViewType[cvTypeSelected]];
  // 'matchingQueries[0] => TOTAL query
  // 'matchingQueries[1] => USED query
  const storageTotal = prometheusResults.getIn([matchingQueries[0], 'result']);
  const storageUsed = prometheusResults.getIn([matchingQueries[1], 'result']);

  return (
    <DashboardCard className="ceph-capacity-card__dashboard-card">
      <DashboardCardHeader>
        <DashboardCardTitle>Capacity</DashboardCardTitle>
        <Dropdown
          className="ceph-capacity-card__dropdown-item"
          items={CapacityViewType}
          onChange={setCapacityViewType}
          selectedKey={[cvTypeSelected]}
        />
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
