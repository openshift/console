import * as React from 'react';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import HealthBody from '@console/shared/src/components/dashboard/status-card/HealthBody';
import { Status } from '@console/shared';
import { ProjectDashboardContext } from './project-dashboard-context';

export const StatusCard: React.FC = () => {
  const { obj } = React.useContext(ProjectDashboardContext);
  return (
    <DashboardCard gradient data-test-id="status-card">
      <DashboardCardHeader>
        <DashboardCardTitle>Status</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody isLoading={!obj}>
        <HealthBody>
          <Status status={obj.status.phase} />
        </HealthBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};
