import * as React from 'react';
import { SelectProps, Select } from '@patternfly/react-core';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import { humanizeBinaryBytes } from '@console/internal/components/utils';
import UtilizationBody from '@console/shared/src/components/dashboard/utilization-card/UtilizationBody';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import {
  useMetricDuration,
  Duration,
} from '@console/shared/src/components/dashboard/duration-hook';
import { PrometheusUtilizationItem } from '@console/internal/components/dashboard/dashboards-page/cluster-dashboard/utilization-card';
import { StorageDashboardQuery, INDEPENDENT_UTILIZATION_QUERIES } from '../../constants/queries';
import { getSelectOptions } from '../dashboard-page/storage-dashboard/breakdown-card/breakdown-dropdown';

const durationSelectItems = getSelectOptions([
  Duration.ONE_HR,
  Duration.SIX_HR,
  Duration.TWENTY_FOUR_HR,
]);

export const UtilizationCard: React.FC = () => {
  const [duration, setDuration] = useMetricDuration();
  const [timestamps, setTimestamps] = React.useState<Date[]>();
  const [isOpen, setOpen] = React.useState(false);

  const handleChange: SelectProps['onSelect'] = (_e, item) => {
    setDuration(item as Duration);
    setOpen(false);
  };
  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Utilization</DashboardCardTitle>
        <Select
          autoFocus={false}
          onSelect={handleChange}
          onToggle={() => setOpen(!isOpen)}
          isOpen={isOpen}
          selections={[duration]}
          placeholderText={duration}
          aria-label="Utilization data time range"
          isCheckboxSelectionBadgeHidden
        >
          {durationSelectItems}
        </Select>
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
