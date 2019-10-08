import * as React from 'react';
import { RedExclamationCircleIcon, YellowExclamationTriangleIcon } from '@console/shared';
import { Alert } from '@console/internal/components/monitoring';
import { getAlertSeverity, getAlertDescription, getAlertMessage } from './utils';

const getSeverityIcon = (severity: string) => {
  let icon;
  switch (severity) {
    case 'critical':
      icon = <RedExclamationCircleIcon />;
      break;
    case 'warning':
    default:
      icon = <YellowExclamationTriangleIcon />;
  }
  return <div className="co-dashboard-icon">{icon}</div>;
};

const AlertItem: React.FC<AlertItemProps> = ({ alert }) => {
  return (
    <div className="co-health-card__alerts-item">
      {getSeverityIcon(getAlertSeverity(alert))}
      <span className="co-health-card__text">
        {getAlertDescription(alert) || getAlertMessage(alert)}
      </span>
    </div>
  );
};

export default AlertItem;

type AlertItemProps = {
  alert: Alert;
};
