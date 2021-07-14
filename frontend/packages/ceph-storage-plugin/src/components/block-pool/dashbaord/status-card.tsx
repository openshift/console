import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { Status } from '@console/shared';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import DetailsBody from '@console/shared/src/components/dashboard/details-card/DetailsBody';

import { BlockPoolDashboardContext } from './block-pool-dashboard-context';

export const StatusCard: React.FC = () => {
  const { t } = useTranslation();
  const { obj } = React.useContext(BlockPoolDashboardContext);

  return (
    <DashboardCard data-test-id="status-card">
      <DashboardCardHeader>
        <DashboardCardTitle>{t('ceph-storage-plugin~Status')}</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <DetailsBody>
          <Status status={obj.status?.phase} />
        </DetailsBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};
