import * as React from 'react';
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
import { Dropdown } from '@console/internal/components/utils';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { getInstantVectorStats } from '@console/internal/components/graphs/utils';
import { ObjectDashboardQuery, ObjectCapacityQueries } from '../../queries';
import { CapacityCardBody } from './capacity-card-body';

import './capacity-card.scss';

const CapacityDropdownType = {
  [ObjectDashboardQuery.CAPACITY_USAGE_PROJECT_QUERY]: 'Projects',
  [ObjectDashboardQuery.CAPACITY_USAGE_BUCKET_CLASS_QUERY]: 'Bucket Class',
};

const dataToMetricMap = {
  [ObjectDashboardQuery.CAPACITY_USAGE_PROJECT_QUERY]: 'project',
  [ObjectDashboardQuery.CAPACITY_USAGE_BUCKET_CLASS_QUERY]: 'bucket_class',
};

const CapacityDropDownValues = Object.keys(CapacityDropdownType);

const ObjectDashboardCapacityCard: React.FC<DashboardItemProps> = ({
  watchPrometheus,
  stopWatchPrometheusQuery,
  prometheusResults,
}) => {
  const [capacityUsageType, setCapacityUsageType] = React.useState(CapacityDropDownValues[0]);

  React.useEffect(() => {
    ObjectCapacityQueries[capacityUsageType].forEach((m: string) => {
      watchPrometheus(m);
    });
    return () => {
      ObjectCapacityQueries[capacityUsageType].forEach((m: string) => {
        stopWatchPrometheusQuery(m);
      });
    };
  }, [watchPrometheus, stopWatchPrometheusQuery, capacityUsageType]);

  const capacityUsageTop6AndOthers: PrometheusResponse = prometheusResults.getIn([
    ObjectCapacityQueries[capacityUsageType][0],
    'data',
  ]);
  const capacityUsageTop6AndOthersError = prometheusResults.getIn([
    ObjectCapacityQueries[capacityUsageType][0],
    'loadError',
  ]);

  const capacityUsageTotalResult: PrometheusResponse = prometheusResults.getIn([
    ObjectCapacityQueries[capacityUsageType][1],
    'data',
  ]);
  const capacityUsageTotalResultError = prometheusResults.getIn([
    ObjectCapacityQueries[capacityUsageType][1],
    'loadError',
  ]);

  let totalUsage = 0;
  const capacityUsageVectorStats = getInstantVectorStats(
    capacityUsageTop6AndOthers,
    dataToMetricMap[capacityUsageType],
  );
  const capacityUsageTotalStats = getInstantVectorStats(capacityUsageTotalResult, '');
  if (capacityUsageTotalStats && capacityUsageTotalStats.length) {
    totalUsage = Number(capacityUsageTotalStats[0].y ? capacityUsageTotalStats[0].y : 0);
  }

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Capacity Breakdown</DashboardCardTitle>
        <Dropdown
          items={CapacityDropdownType}
          onChange={setCapacityUsageType}
          selectedKey={[capacityUsageType]}
        />
      </DashboardCardHeader>
      <DashboardCardBody className="co-dashboard-card__body--top-margin">
        <CapacityCardBody
          error={capacityUsageTop6AndOthersError || capacityUsageTotalResultError}
          isLoading={!capacityUsageTop6AndOthers || !capacityUsageTotalResult}
          metricsData={capacityUsageVectorStats}
          totalUsage={totalUsage}
        />
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default withDashboardResources(ObjectDashboardCapacityCard);
