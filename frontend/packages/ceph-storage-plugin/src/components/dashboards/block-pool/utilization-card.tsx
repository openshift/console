import * as React from 'react';
import { useTranslation } from 'react-i18next';

import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import UtilizationBody from '@console/shared/src/components/dashboard/utilization-card/UtilizationBody';
import { PrometheusUtilizationItem } from '@console/internal/components/dashboard/dashboards-page/cluster-dashboard/utilization-card';
import { humanizeDecimalBytesPerSec } from '@console/internal/components/utils';
import { UtilizationDurationDropdown } from '@console/shared/src/components/dashboard/utilization-card/UtilizationDurationDropdown';

import { BlockPoolDashboardContext } from './block-pool-dashboard-context';
import { humanizeIOPS } from '../persistent-internal/utilization-card/utils';
import { getPoolQuery, StorageDashboardQuery } from '../../../queries';

export const UtilizationCard: React.FC = () => {
  const { t } = useTranslation();
  const { obj } = React.useContext(BlockPoolDashboardContext);
  const { name } = obj.metadata;

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>{t('ceph-storage-plugin~Performance')}</DashboardCardTitle>
        <UtilizationDurationDropdown />
      </DashboardCardHeader>
      <UtilizationBody>
        <PrometheusUtilizationItem
          title={t('ceph-storage-plugin~IOPS')}
          utilizationQuery={getPoolQuery([name], StorageDashboardQuery.POOL_UTILIZATION_IOPS_QUERY)}
          humanizeValue={humanizeIOPS}
        />
        <PrometheusUtilizationItem
          title={t('ceph-storage-plugin~Throughput')}
          utilizationQuery={getPoolQuery(
            [name],
            StorageDashboardQuery.POOL_UTILIZATION_THROUGHPUT_QUERY,
          )}
          humanizeValue={humanizeDecimalBytesPerSec}
        />
      </UtilizationBody>
    </DashboardCard>
  );
};

export default UtilizationCard;
