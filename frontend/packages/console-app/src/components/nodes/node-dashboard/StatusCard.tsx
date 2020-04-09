import * as React from 'react';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';

import { NodeDashboardContext } from './NodeDashboardContext';
import NodeHealth from './NodeHealth';
import NodeAlerts from './NodeAlerts';

const StatusCard: React.FC = () => {
  const { obj } = React.useContext(NodeDashboardContext);
  return (
    <DashboardCard gradient data-test-id="status-card">
      <DashboardCardHeader>
        <DashboardCardTitle>Status</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody isLoading={!obj}>
        <NodeHealth />
        <NodeAlerts />
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default StatusCard;
