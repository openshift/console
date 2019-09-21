import * as React from 'react';
import { Link } from 'react-router-dom';
import { RedExclamationCircleIcon, YellowExclamationTriangleIcon } from '@console/shared';
import {
  getAlertSeverity,
  getAlertMessage,
  getAlertDescription,
  getAlertTime,
} from '../health-card';
import { Alert, alertURL } from '../../monitoring';
import { Timestamp } from '../../utils';

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'critical':
      return RedExclamationCircleIcon;
    case 'warning':
    default:
      return YellowExclamationTriangleIcon;
  }
};

export const StatusItem: React.FC<StatusItemProps> = ({
  Icon,
  timestamp,
  message,
  LinkComponent,
}) => {
  return (
    <div className="co-status-card__alert-item">
      <div className="co-dashboard-icon">
        <Icon />
      </div>
      <div className="co-status-card__alert-item-text">
        <div className="co-status-card__alert-item-message">
          <div className="co-health-card__alert-item-timestamp co-health-card__text text-secondary">
            {timestamp && <Timestamp simple timestamp={timestamp} />}
          </div>
          <span className="co-health-card__text">{message}</span>
        </div>
        <div className="co-status-card__alert-item-more">
          <LinkComponent />
        </div>
      </div>
    </div>
  );
};

export const AlertItem: React.FC<AlertItemProps> = ({ alert }) => {
  const LinkComponent = React.useCallback(
    () => <Link to={alertURL(alert, alert.rule.id)}>View more</Link>,
    [alert],
  );
  return (
    <StatusItem
      Icon={getSeverityIcon(getAlertSeverity(alert))}
      timestamp={getAlertTime(alert)}
      message={getAlertDescription(alert) || getAlertMessage(alert)}
      LinkComponent={LinkComponent}
    />
  );
};

type StatusItemProps = {
  Icon: React.ComponentType<any>;
  timestamp?: string;
  message: string;
  LinkComponent: React.ComponentType<any>;
};

type AlertItemProps = {
  alert: Alert;
};
