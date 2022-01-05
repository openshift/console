import * as React from 'react';
import { Card, CardHeader, CardTitle } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { DashboardAlerts } from '@console/internal/components/dashboard/dashboards-page/cluster-dashboard/status-card';
import { LoadingInline } from '@console/internal/components/utils';
import NodeAlerts from './NodeAlerts';
import { NodeDashboardContext } from './NodeDashboardContext';
import NodeHealth from './NodeHealth';

const StatusCard: React.FC = () => {
  const { obj } = React.useContext(NodeDashboardContext);
  const { t } = useTranslation();
  return (
    <Card data-test-id="status-card" className="co-overview-card--gradient">
      <CardHeader>
        <CardTitle>{t('console-app~Status')}</CardTitle>
      </CardHeader>
      {obj ? (
        <>
          <NodeHealth />
          <NodeAlerts />
          <DashboardAlerts labelSelector={{ node: obj.metadata.name }} />
        </>
      ) : (
        <LoadingInline />
      )}
    </Card>
  );
};

export default StatusCard;
