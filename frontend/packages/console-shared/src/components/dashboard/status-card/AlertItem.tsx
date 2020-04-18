import * as React from 'react';
import { Link } from 'react-router-dom';
import { Timestamp } from '@console/internal/components/utils/timestamp';
import { alertURL, Alert } from '@console/internal/components/monitoring';
import { RedExclamationCircleIcon, YellowExclamationTriangleIcon } from '../../status/icons';
import {
  getAlertSeverity,
  getAlertMessage,
  getAlertDescription,
  getAlertTime,
} from './alert-utils';

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'critical':
      return RedExclamationCircleIcon;
    case 'warning':
    default:
      return YellowExclamationTriangleIcon;
  }
};

export const StatusItem: React.FC<StatusItemProps> = ({ Icon, timestamp, message, children }) => {
  return (
    <div className="co-status-card__alert-item">
      <div className="co-status-card__alert-item-icon co-dashboard-icon">
        <Icon />
      </div>
      <div className="co-status-card__alert-item-text">
        <div className="co-status-card__alert-item-message">
          <div className="co-health-card__alert-item-timestamp co-status-card__health-item-text text-secondary">
            {timestamp && <Timestamp simple timestamp={timestamp} />}
          </div>
          <span className="co-status-card__health-item-text co-break-word">{message}</span>
        </div>
        {children && <div className="co-status-card__alert-item-more">{children}</div>}
      </div>
    </div>
  );
};

const AlertItem: React.FC<AlertItemProps> = ({ alert }) => (
  <StatusItem
    Icon={getSeverityIcon(getAlertSeverity(alert))}
    timestamp={getAlertTime(alert)}
    message={getAlertDescription(alert) || getAlertMessage(alert)}
  >
    <Link to={alertURL(alert, alert.rule.id)}>View details</Link>
  </StatusItem>
);

export default AlertItem;

type StatusItemProps = {
  Icon: React.ComponentType<any>;
  timestamp?: string;
  message: string;
};

type AlertItemProps = {
  alert: Alert;
};
