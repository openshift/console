import * as React from 'react';
import { VmStatus } from 'kubevirt-web-ui-components';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import HealthBody from '@console/shared/src/components/dashboard/health-card/HealthBody';
import { DashboardItemProps } from '@console/internal/components/dashboard/with-dashboard-resources';
import { VMDashboardContext } from '../../vms/vm-dashboard-context';
import { VMAlerts } from './vm-alerts';

import './vm-status-card.scss';

export const VMStatusCard: React.FC<VMStatusCardProps> = () => {
  const vmDashboardContext = React.useContext(VMDashboardContext);
  const { vm, vmi, pods, migrations } = vmDashboardContext;

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Status</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <HealthBody>
          <VmStatus vm={vm} pods={pods} migrations={migrations} />
        </HealthBody>
        <VMAlerts vm={vm} vmi={vmi} />
      </DashboardCardBody>
    </DashboardCard>
  );
};

type VMStatusCardProps = DashboardItemProps;
