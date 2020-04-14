import * as React from 'react';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import HealthBody from '@console/shared/src/components/dashboard/status-card/HealthBody';
import { DashboardItemProps } from '@console/internal/components/dashboard/with-dashboard-resources';
import { VMStatus } from '../../vm-status';
import { VMDashboardContext } from '../../vms/vm-dashboard-context';
import { VMAlerts } from './vm-alerts';

export const VMStatusCard: React.FC<VMStatusCardProps> = () => {
  const vmDashboardContext = React.useContext(VMDashboardContext);
  const { vm, vmi, pods, migrations, vmImports } = vmDashboardContext;

  return (
    <DashboardCard gradient>
      <DashboardCardHeader>
        <DashboardCardTitle>Status</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <HealthBody>
          <VMStatus vm={vm} vmi={vmi} pods={pods} migrations={migrations} vmImports={vmImports} />
        </HealthBody>
        <VMAlerts vm={vm} vmi={vmi} />
      </DashboardCardBody>
    </DashboardCard>
  );
};

type VMStatusCardProps = DashboardItemProps;
