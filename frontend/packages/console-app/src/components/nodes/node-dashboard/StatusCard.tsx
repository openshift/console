import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardAlerts } from '@console/internal/components/dashboard/dashboards-page/cluster-dashboard/status-card';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import NodeAlerts from './NodeAlerts';
import { NodeDashboardContext } from './NodeDashboardContext';
import NodeHealth from './NodeHealth';

const StatusCard: React.FC = () => {
  const { obj } = React.useContext(NodeDashboardContext);
  const { t } = useTranslation();
  return (
    <DashboardCard gradient data-test-id="status-card">
      <DashboardCardHeader>
        <DashboardCardTitle>{t('console-app~Status')}</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody isLoading={!obj}>
        <NodeHealth />
        <NodeAlerts />
        <DashboardAlerts labelSelector={{ node: obj.metadata.name }} />
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default StatusCard;
