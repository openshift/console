import * as React from 'react';
import * as _ from 'lodash';

import { DashboardCard } from '@console/internal/components/dashboard/dashboard-card/card';
import { DashboardCardBody } from '@console/internal/components/dashboard/dashboard-card/card-body';
import { DashboardCardHeader } from '@console/internal/components/dashboard/dashboard-card/card-header';
import { DashboardCardTitle } from '@console/internal/components/dashboard/dashboard-card/card-title';
import { Dropdown } from '@console/internal/components/utils/dropdown';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboards-page/with-dashboard-resources';
import { getRangeVectorStats } from '@console/internal/components/graphs/utils';
import { humanizeDecimalBytesPerSec } from '@console/internal/components/utils';
import { UtilizationBody } from '@console/internal/components/dashboard/utilization-card/utilization-body';
import { UtilizationItem } from '@console/internal/components/dashboard/utilization-card/utilization-item';
import { humanizeIOPS, humanizeLatency } from './utils';
import { ONE_HR, SIX_HR, TWENTY_FOUR_HR } from '../../../../constants';
import {
  StorageDashboardQuery,
  UTILIZATION_QUERY,
  UTILIZATION_QUERY_HOUR_MAP,
} from '../../../../constants/queries';

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

  const iopsUtilization = prometheusResults.getIn([
    UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_IOPS_QUERY] +
      UTILIZATION_QUERY_HOUR_MAP[duration],
    'result',
  ]);
  const latencyUtilization = prometheusResults.getIn([
    UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_LATENCY_QUERY] +
      UTILIZATION_QUERY_HOUR_MAP[duration],
    'result',
  ]);
  const throughputUtilization = prometheusResults.getIn([
    UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_THROUGHPUT_QUERY] +
      UTILIZATION_QUERY_HOUR_MAP[duration],
    'result',
  ]);
  const recoveryUtilization = prometheusResults.getIn([
    UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_RECOVERY_RATE_QUERY] +
      UTILIZATION_QUERY_HOUR_MAP[duration],
    'result',
  ]);

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
            title="IOPS"
            data={iopsStats}
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
