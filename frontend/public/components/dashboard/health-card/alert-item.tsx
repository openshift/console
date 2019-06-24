import * as React from 'react';
import { Icon } from 'patternfly-react';

import { getAlertSeverity, getAlertMessage, getAlertDescription } from './';
import { Alert } from '../../monitoring';

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'critical':
      return (
        <Icon type="fa" name="exclamation-circle" className="co-health-card__alerts-icon co-health-card__alerts-icon--critical" />
      );
    case 'warning':
    default:
      return (
        <Icon type="fa" name="exclamation-triangle" className="co-health-card__alerts-icon co-health-card__alerts-icon--warning" />
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
