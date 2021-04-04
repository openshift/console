import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { DashboardItemProps } from '@console/internal/components/dashboard/with-dashboard-resources';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import HealthBody from '@console/shared/src/components/dashboard/status-card/HealthBody';

import { VMStatus } from '../../vm-status/vm-status';
import { VMDashboardContext } from '../../vms/vm-dashboard-context';
import { VMAlerts } from './vm-alerts';

export const VMStatusCard: React.FC<VMStatusCardProps> = () => {
  const { t } = useTranslation();
  const vmDashboardContext = React.useContext(VMDashboardContext);
  const { vm, vmi, vmStatusBundle } = vmDashboardContext;

  return (
    <DashboardCard gradient>
      <DashboardCardHeader>
        <DashboardCardTitle>{t('kubevirt-plugin~Status')}</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <HealthBody>
          <VMStatus vm={vm} vmi={vmi} vmStatusBundle={vmStatusBundle} />
        </HealthBody>
        <VMAlerts vmi={vmi} />
      </DashboardCardBody>
    </DashboardCard>
  );
};

type VMStatusCardProps = DashboardItemProps;
