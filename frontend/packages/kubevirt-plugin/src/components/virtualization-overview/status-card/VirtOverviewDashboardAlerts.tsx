import * as React from 'react';
import * as _ from 'lodash';
import { alertURL } from '@console/internal/components/monitoring/utils';
import AlertItem from '@console/shared/src/components/dashboard/status-card/AlertItem';
import AlertsBody from '@console/shared/src/components/dashboard/status-card/AlertsBody';
import useFilteredAlerts from '../../../hooks/useFilteredAlerts';

const OPERATOR_LABEL_KEY = 'kubernetes_operator_part_of';
const isKubeVirtAlert = (alert) => alert?.labels?.[OPERATOR_LABEL_KEY] === 'kubevirt';

const VirtualizationOverviewDashboardAlerts: React.FC = () => {
  const [alerts, , loadError] = useFilteredAlerts(isKubeVirtAlert);

  return (
    <AlertsBody error={!_.isEmpty(loadError)}>
      {alerts.map((alert) => (
        <AlertItem key={alertURL(alert, alert.rule.id)} alert={alert} />
      ))}
    </AlertsBody>
  );
};

export default VirtualizationOverviewDashboardAlerts;
