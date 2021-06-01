import * as React from 'react';
import { useTranslation } from 'react-i18next';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import { humanizeBinaryBytes } from '@console/internal/components/utils';
import UtilizationBody from '@console/shared/src/components/dashboard/utilization-card/UtilizationBody';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import { PrometheusUtilizationItem } from '@console/internal/components/dashboard/dashboards-page/cluster-dashboard/utilization-card';
import { UtilizationDurationDropdown } from '@console/shared/src/components/dashboard/utilization-card/UtilizationDurationDropdown';
import { DEFAULT_DURATION, useDateRange } from '@console/shared';
import { StorageDashboardQuery, INDEPENDENT_UTILIZATION_QUERIES } from '../../../queries';

export const UtilizationCard: React.FC = () => {
  const { t } = useTranslation();
  const [duration, setDuration] = React.useState(DEFAULT_DURATION);
  const [startDate, endDate, updateEndDate] = useDateRange(duration);
  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>{t('ceph-storage-plugin~Utilization')}</DashboardCardTitle>
        <UtilizationDurationDropdown onChange={setDuration} />
      </DashboardCardHeader>
      <DashboardCardBody>
        <UtilizationBody startDate={startDate} endDate={endDate}>
          <PrometheusUtilizationItem
            title={t('ceph-storage-plugin~Used Capacity')}
            utilizationQuery={INDEPENDENT_UTILIZATION_QUERIES[StorageDashboardQuery.USED_CAPACITY]}
            duration={duration}
            humanizeValue={humanizeBinaryBytes}
            byteDataType={ByteDataTypes.BinaryBytes}
            startDate={startDate}
            endDate={endDate}
            updateEndDate={updateEndDate}
          />
          <PrometheusUtilizationItem
            title={t('ceph-storage-plugin~Requested capacity')}
            utilizationQuery={
              INDEPENDENT_UTILIZATION_QUERIES[StorageDashboardQuery.REQUESTED_CAPACITY]
            }
            duration={duration}
            humanizeValue={humanizeBinaryBytes}
            byteDataType={ByteDataTypes.BinaryBytes}
            startDate={startDate}
            endDate={endDate}
            updateEndDate={updateEndDate}
          />
        </UtilizationBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default UtilizationCard;
