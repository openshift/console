import * as React from 'react';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import { Dropdown, humanizeBinaryBytes } from '@console/internal/components/utils';
import UtilizationBody from '@console/shared/src/components/dashboard/utilization-card/UtilizationBody';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import {
  useMetricDuration,
  Duration,
} from '@console/shared/src/components/dashboard/duration-hook';
import { PrometheusUtilizationItem } from '@console/internal/components/dashboard/dashboards-page/cluster-dashboard/utilization-card';
import { StorageDashboardQuery, INDEPENDENT_UTILIZATION_QUERIES } from '../../constants/queries';

export const UtilizationCard: React.FC = () => {
  const [duration, setDuration] = useMetricDuration();
  const [timestamps, setTimestamps] = React.useState<Date[]>();

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Utilization</DashboardCardTitle>
        <Dropdown items={Duration} onChange={setDuration} selectedKey={duration} title={duration} />
      </DashboardCardHeader>
      <DashboardCardBody>
        <UtilizationBody timestamps={timestamps}>
          <PrometheusUtilizationItem
            title="Used Capacity"
            utilizationQuery={INDEPENDENT_UTILIZATION_QUERIES[StorageDashboardQuery.USED_CAPACITY]}
            duration={duration}
            humanizeValue={humanizeBinaryBytes}
            byteDataType={ByteDataTypes.BinaryBytes}
            setTimestamps={setTimestamps}
          />
          <PrometheusUtilizationItem
            title="Requested capacity"
            utilizationQuery={
              INDEPENDENT_UTILIZATION_QUERIES[StorageDashboardQuery.REQUESTED_CAPACITY]
            }
            duration={duration}
            humanizeValue={humanizeBinaryBytes}
            byteDataType={ByteDataTypes.BinaryBytes}
            setTimestamps={setTimestamps}
          />
        </UtilizationBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default UtilizationCard;
