import * as React from 'react';

import { RedExclamationCircleIcon, YellowExclamationTriangleIcon } from '@console/shared';
import { getAlertSeverity, getAlertMessage, getAlertDescription } from './';
import { Alert } from '../../monitoring';

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'critical':
      return (
        <RedExclamationCircleIcon className="co-health-card__alerts-icon" />
      );
    case 'warning':
    default:
      return (
        <YellowExclamationTriangleIcon className="co-health-card__alerts-icons" />
      );
  }
};

export const AlertItem: React.FC<AlertItemProps> = ({ alert }) => {
  return (
    <div className="co-health-card__alerts-item">
      {getSeverityIcon(getAlertSeverity(alert))}
      <div className="co-health-card__alerts-item-message">{getAlertDescription(alert) || getAlertMessage(alert)}</div>
    </div>
  );
};

type AlertItemProps = {
  alert: Alert;
};
