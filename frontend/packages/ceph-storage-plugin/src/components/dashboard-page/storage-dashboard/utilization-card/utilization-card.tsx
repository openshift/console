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
import {
  ONE_HR,
  SIX_HR,
  TWENTY_FOUR_HR,
  UTILIZATION_QUERY_HOUR_MAP,
} from '@console/shared/src/components/dashboard/utilization-card/dropdown-value';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import ConsumerPopover from '@console/shared/src/components/dashboard/utilization-card/TopConsumerPopover';
import { getPrometheusQueryResponse } from '@console/internal/actions/dashboards';
import {
  StorageDashboardQuery,
  UTILIZATION_QUERY,
  utilizationPopoverQueryMap,
  TOTAL_QUERY,
} from '../../../../constants/queries';
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
      watchPrometheus(UTILIZATION_QUERY[key], null, UTILIZATION_QUERY_HOUR_MAP[duration]),
    );
    Object.keys(TOTAL_QUERY).forEach((key) => watchPrometheus(TOTAL_QUERY[key]));
    return () => {
      Object.keys(UTILIZATION_QUERY).forEach((key) =>
        stopWatchPrometheusQuery(UTILIZATION_QUERY[key], UTILIZATION_QUERY_HOUR_MAP[duration]),
      );
      Object.keys(TOTAL_QUERY).forEach((key) => stopWatchPrometheusQuery(TOTAL_QUERY[key]));
    };
  }, [watchPrometheus, stopWatchPrometheusQuery, duration]);

  const [capacityUtilization, capacityUtilizationError] = getPrometheusQueryResponse(
    prometheusResults,
    UTILIZATION_QUERY[StorageDashboardQuery.CEPH_CAPACITY_USED],
    UTILIZATION_QUERY_HOUR_MAP[duration],
  );
  const [totalCapacity, totalCapacityError] = getPrometheusQueryResponse(
    prometheusResults,
    UTILIZATION_QUERY[StorageDashboardQuery.CEPH_CAPACITY_TOTAL],
  );
  const [iopsUtilization, iopsUtilizationError] = getPrometheusQueryResponse(
    prometheusResults,
    UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_IOPS_QUERY],
    UTILIZATION_QUERY_HOUR_MAP[duration],
  );
  const [latencyUtilization, latencyUtilizationError] = getPrometheusQueryResponse(
    prometheusResults,
    UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_LATENCY_QUERY],
    UTILIZATION_QUERY_HOUR_MAP[duration],
  );
  const [throughputUtilization, throughputUtilizationError] = getPrometheusQueryResponse(
    prometheusResults,
    UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_THROUGHPUT_QUERY],
    UTILIZATION_QUERY_HOUR_MAP[duration],
  );
  const [recoveryUtilization, recoveryUtilizationError] = getPrometheusQueryResponse(
    prometheusResults,
    UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_RECOVERY_RATE_QUERY],
    UTILIZATION_QUERY_HOUR_MAP[duration],
  );

  const storagePopover = React.useCallback(
    ({ current }) => (
      <ConsumerPopover
        title="Used Capacity"
        current={current}
        consumers={utilizationPopoverQueryMap}
        humanize={humanizeBinaryBytes}
      />
    ),
    [],
  );

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
            byteDataType={ByteDataTypes.BinaryBytes}
            query={UTILIZATION_QUERY[StorageDashboardQuery.CEPH_CAPACITY_USED]}
            error={capacityUtilizationError || totalCapacityError}
            isLoading={!capacityUtilization || !totalCapacity}
            max={maxCapacityStats}
            TopConsumerPopover={storagePopover}
          />
          <UtilizationItem
            title="IOPS"
            data={iopsStats}
            error={iopsUtilizationError}
            isLoading={!iopsUtilization}
            humanizeValue={humanizeIOPS}
            query={UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_IOPS_QUERY]}
          />
          <UtilizationItem
            title="Latency"
            data={latencyStats}
            error={latencyUtilizationError}
            isLoading={!latencyUtilization}
            humanizeValue={humanizeLatency}
            query={UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_LATENCY_QUERY]}
          />
          <UtilizationItem
            title="Throughput"
            data={throughputStats}
            error={throughputUtilizationError}
            isLoading={!throughputUtilization}
            humanizeValue={humanizeDecimalBytesPerSec}
            query={UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_THROUGHPUT_QUERY]}
          />
          <UtilizationItem
            title="Recovery"
            data={recoveryStats}
            error={recoveryUtilizationError}
            isLoading={!recoveryUtilization}
            humanizeValue={humanizeDecimalBytesPerSec}
            query={UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_RECOVERY_RATE_QUERY]}
          />
        </UtilizationBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default withDashboardResources(UtilizationCard);
