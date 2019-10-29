import * as React from 'react';
import * as _ from 'lodash';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import { Dropdown } from '@console/internal/components/utils/dropdown';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import { getRangeVectorStats } from '@console/internal/components/graphs/utils';
import {
  humanizeBinaryBytes,
  humanizeDecimalBytesPerSec,
} from '@console/internal/components/utils';
import UtilizationBody from '@console/shared/src/components/dashboard/utilization-card/UtilizationBody';
import UtilizationItem from '@console/shared/src/components/dashboard/utilization-card/UtilizationItem';
import { PrometheusResponse } from '@console/internal/components/graphs';
import {
  ONE_HR,
  SIX_HR,
  TWENTY_FOUR_HR,
  UTILIZATION_QUERY_HOUR_MAP,
} from '@console/shared/src/components/dashboard/utilization-card/dropdown-value';
import { StorageDashboardQuery, UTILIZATION_QUERY } from '../../../../constants/queries';
import { getLatestValue, humanizeIOPS, humanizeLatency } from './utils';

const metricDurations = [ONE_HR, SIX_HR, TWENTY_FOUR_HR];
const metricDurationsOptions = _.zipObject(metricDurations, metricDurations);

const UtilizationCard: React.FC<DashboardItemProps> = ({
  watchPrometheus,
  stopWatchPrometheusQuery,
  prometheusResults,
}) => {
  const [duration, setDuration] = React.useState(metricDurations[0]);
  React.useEffect(() => {
    Object.keys(UTILIZATION_QUERY).forEach((key) =>
      watchPrometheus(UTILIZATION_QUERY[key] + UTILIZATION_QUERY_HOUR_MAP[duration]),
    );
    return () => {
      Object.keys(UTILIZATION_QUERY).forEach((key) =>
        stopWatchPrometheusQuery(UTILIZATION_QUERY[key] + UTILIZATION_QUERY_HOUR_MAP[duration]),
      );
    };
  }, [watchPrometheus, stopWatchPrometheusQuery, duration]);

  const capacityUtilization = prometheusResults.getIn([
    UTILIZATION_QUERY[StorageDashboardQuery.CEPH_CAPACITY_USED] +
      UTILIZATION_QUERY_HOUR_MAP[duration],
    'data',
  ]) as PrometheusResponse;
  const capacityUtilizationError = prometheusResults.getIn([
    UTILIZATION_QUERY[StorageDashboardQuery.CEPH_CAPACITY_USED] +
      UTILIZATION_QUERY_HOUR_MAP[duration],
    'loadError',
  ]);
  const totalCapacity = prometheusResults.getIn([
    UTILIZATION_QUERY[StorageDashboardQuery.CEPH_CAPACITY_TOTAL] +
      UTILIZATION_QUERY_HOUR_MAP[duration],
    'data',
  ]) as PrometheusResponse;
  const totalCapacityError = prometheusResults.getIn([
    UTILIZATION_QUERY[StorageDashboardQuery.CEPH_CAPACITY_TOTAL] +
      UTILIZATION_QUERY_HOUR_MAP[duration],
    'loadError',
  ]);
  const iopsUtilization = prometheusResults.getIn([
    UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_IOPS_QUERY] +
      UTILIZATION_QUERY_HOUR_MAP[duration],
    'data',
  ]) as PrometheusResponse;
  const iopsUtilizationError = prometheusResults.getIn([
    UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_IOPS_QUERY] +
      UTILIZATION_QUERY_HOUR_MAP[duration],
    'loadError',
  ]);
  const latencyUtilization = prometheusResults.getIn([
    UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_LATENCY_QUERY] +
      UTILIZATION_QUERY_HOUR_MAP[duration],
    'data',
  ]) as PrometheusResponse;
  const latencyUtilizationError = prometheusResults.getIn([
    UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_LATENCY_QUERY] +
      UTILIZATION_QUERY_HOUR_MAP[duration],
    'loadError',
  ]);
  const throughputUtilization = prometheusResults.getIn([
    UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_THROUGHPUT_QUERY] +
      UTILIZATION_QUERY_HOUR_MAP[duration],
    'data',
  ]) as PrometheusResponse;
  const throughputUtilizationError = prometheusResults.getIn([
    UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_THROUGHPUT_QUERY] +
      UTILIZATION_QUERY_HOUR_MAP[duration],
    'loadError',
  ]);
  const recoveryUtilization = prometheusResults.getIn([
    UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_RECOVERY_RATE_QUERY] +
      UTILIZATION_QUERY_HOUR_MAP[duration],
    'data',
  ]) as PrometheusResponse;
  const recoveryUtilizationError = prometheusResults.getIn([
    UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_RECOVERY_RATE_QUERY] +
      UTILIZATION_QUERY_HOUR_MAP[duration],
    'loadError',
  ]);

  const capacityStats = getRangeVectorStats(capacityUtilization);
  const maxCapacityStats = getLatestValue(getRangeVectorStats(totalCapacity));
  const iopsStats = getRangeVectorStats(iopsUtilization);
  const latencyStats = getRangeVectorStats(latencyUtilization);
  const throughputStats = getRangeVectorStats(throughputUtilization);
  const recoveryStats = getRangeVectorStats(recoveryUtilization);

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Utilization</DashboardCardTitle>
        <Dropdown
          items={metricDurationsOptions}
          onChange={setDuration}
          selectedKey={duration}
          title={duration}
        />
      </DashboardCardHeader>
      <DashboardCardBody>
        <UtilizationBody timestamps={iopsStats.map((stat) => stat.x as Date)}>
          <UtilizationItem
            title="Used Capacity"
            data={capacityStats}
            humanizeValue={humanizeBinaryBytes}
            query={
              UTILIZATION_QUERY[StorageDashboardQuery.CEPH_CAPACITY_USED] +
              UTILIZATION_QUERY_HOUR_MAP[duration]
            }
            error={capacityUtilizationError || totalCapacityError}
            isLoading={!capacityUtilization || !totalCapacity}
            max={maxCapacityStats}
          />
          <UtilizationItem
            title="IOPS"
            data={iopsStats}
            error={iopsUtilizationError}
            isLoading={!iopsUtilization}
            humanizeValue={humanizeIOPS}
            query={
              UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_IOPS_QUERY] +
              UTILIZATION_QUERY_HOUR_MAP[duration]
            }
          />
          <UtilizationItem
            title="Latency"
            data={latencyStats}
            error={latencyUtilizationError}
            isLoading={!latencyUtilization}
            humanizeValue={humanizeLatency}
            query={
              UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_LATENCY_QUERY] +
              UTILIZATION_QUERY_HOUR_MAP[duration]
            }
          />
          <UtilizationItem
            title="Throughput"
            data={throughputStats}
            error={throughputUtilizationError}
            isLoading={!throughputUtilization}
            humanizeValue={humanizeDecimalBytesPerSec}
            query={
              UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_THROUGHPUT_QUERY] +
              UTILIZATION_QUERY_HOUR_MAP[duration]
            }
          />
          <UtilizationItem
            title="Recovery"
            data={recoveryStats}
            error={recoveryUtilizationError}
            isLoading={!recoveryUtilization}
            humanizeValue={humanizeDecimalBytesPerSec}
            query={
              UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_RECOVERY_RATE_QUERY] +
              UTILIZATION_QUERY_HOUR_MAP[duration]
            }
          />
        </UtilizationBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default withDashboardResources(UtilizationCard);
