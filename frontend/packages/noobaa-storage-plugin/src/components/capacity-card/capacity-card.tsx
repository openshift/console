import * as React from 'react';
import * as _ from 'lodash';
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
import { ObjectCapacityQueries } from '../../queries';
import { getInstantVectorStats, PrometheusResponse } from './capacity-card-utils';
import { CapacityCardBody } from './capacity-card-body';

export const QueryType = {
  Projects: 'PROJECT_QUERY',
  'Bucket Class': 'BUCKET_CLASS_QUERY',
};

export const DataToQueryMap = {
  Projects: 'project',
  'Bucket Class': 'bucket_class',
};

const CapacityDropDownValues = Object.keys(QueryType);
const CapacityDropDownOptions = _.zipObject(CapacityDropDownValues, CapacityDropDownValues);

const ObjectDashboardCapacityCard: React.FC<DashboardItemProps> = ({
  watchPrometheus,
  stopWatchPrometheusQuery,
  prometheusResults,
}) => {
  const [capacityUsageType, setCapacityUsageType] = React.useState(CapacityDropDownValues[0]);

  React.useEffect(() => {
    watchPrometheus(ObjectCapacityQueries[QueryType[capacityUsageType]]);
    return () => {
      stopWatchPrometheusQuery(ObjectCapacityQueries[QueryType[capacityUsageType]]);
    };
  }, [watchPrometheus, stopWatchPrometheusQuery, capacityUsageType]);

  const capacityUsageResults: PrometheusResponse = prometheusResults.getIn([
    ObjectCapacityQueries[QueryType[capacityUsageType]],
    'result',
  ]);
  const capacityUsageVectorStats = getInstantVectorStats(
    capacityUsageResults,
    DataToQueryMap[capacityUsageType],
  );

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Capacity Usage</DashboardCardTitle>
        <Dropdown
          className="nb-capacity-card__dropdown-item"
          items={CapacityDropDownOptions}
          onChange={setCapacityUsageType}
          selectedKey={capacityUsageType}
        />
      </DashboardCardHeader>
      <DashboardCardBody>
        <CapacityCardBody
          isLoading={!capacityUsageResults}
          metricsData={capacityUsageVectorStats}
        />
      </DashboardCardBody>
    </DashboardCard>
  );
};

// export default withDashboardResources(CapacityCard);
export default withDashboardResources(ObjectDashboardCapacityCard);
