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
import { StorageDashboardQuery, INDEPENDENT_UTILIZATION_QUERIES } from '../../../queries';

export const UtilizationCard: React.FC = () => {
  const { t } = useTranslation();
  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>{t('ceph-storage-plugin~Utilization')}</DashboardCardTitle>
        <UtilizationDurationDropdown />
      </DashboardCardHeader>
      <DashboardCardBody>
        <UtilizationBody>
          <PrometheusUtilizationItem
            title={t('ceph-storage-plugin~Used Capacity')}
            utilizationQuery={INDEPENDENT_UTILIZATION_QUERIES[StorageDashboardQuery.USED_CAPACITY]}
            humanizeValue={humanizeBinaryBytes}
            byteDataType={ByteDataTypes.BinaryBytes}
          />
          <PrometheusUtilizationItem
            title={t('ceph-storage-plugin~Requested capacity')}
            utilizationQuery={
              INDEPENDENT_UTILIZATION_QUERIES[StorageDashboardQuery.REQUESTED_CAPACITY]
            }
            humanizeValue={humanizeBinaryBytes}
            byteDataType={ByteDataTypes.BinaryBytes}
          />
        </UtilizationBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default UtilizationCard;
