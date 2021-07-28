import * as React from 'react';
import { useTranslation } from 'react-i18next';

import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import DetailItem from '@console/shared/src/components/dashboard/details-card/DetailItem';
import DetailsBody from '@console/shared/src/components/dashboard/details-card/DetailsBody';

import { BlockPoolDashboardContext } from './block-pool-dashboard-context';

export const DetailsCard: React.FC = () => {
  const { t } = useTranslation();
  const { obj } = React.useContext(BlockPoolDashboardContext);
  const volumeType = obj.spec?.deviceClass?.toUpperCase() ?? '-';

  return (
    <DashboardCard data-test-id="details-card">
      <DashboardCardHeader>
        <DashboardCardTitle>{t('ceph-storage-plugin~Details')}</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <DetailsBody>
          <DetailItem isLoading={!obj} title={t('ceph-storage-plugin~Pool name')}>
            {obj.metadata?.name}
          </DetailItem>
          <DetailItem isLoading={!obj} title={t('ceph-storage-plugin~Volume type')}>
            {volumeType}
          </DetailItem>
          <DetailItem isLoading={!obj} title={t('ceph-storage-plugin~Replicas')}>
            {obj.spec?.replicated?.size}
          </DetailItem>
        </DetailsBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};
