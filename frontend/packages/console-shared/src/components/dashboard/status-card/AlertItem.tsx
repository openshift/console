import * as React from 'react';
import * as _ from 'lodash';
import { Link } from 'react-router-dom';
import { isAlertAction, useExtensions, AlertAction } from '@console/plugin-sdk';
import { getAlertActions } from '@console/internal/components/notification-drawer';
import { Timestamp } from '@console/internal/components/utils/timestamp';
import { Alert } from '@console/internal/components/monitoring/types';
import { alertURL } from '@console/internal/components/monitoring/utils';
import { RedExclamationCircleIcon, YellowExclamationTriangleIcon } from '../../status/icons';
import {
  getAlertSeverity,
  getAlertMessage,
  getAlertDescription,
  getAlertTime,
} from './alert-utils';

const CriticalIcon = () => <RedExclamationCircleIcon title="Critical" />;
const WarningIcon = () => <YellowExclamationTriangleIcon title="Warning" />;
const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'critical':
      return CriticalIcon;
    case 'warning':
    default:
      return WarningIcon;
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

const AlertItem: React.FC<AlertItemProps> = ({ alert }) => {
  const actionsExtensions = useExtensions<AlertAction>(isAlertAction);
  const action = getAlertActions(actionsExtensions).get(alert.rule.name);
  return (
    <StatusItem
      Icon={getSeverityIcon(getAlertSeverity(alert))}
      timestamp={getAlertTime(alert)}
      message={getAlertDescription(alert) || getAlertMessage(alert)}
    >
      {action ? (
        <Link to={_.isFunction(action.path) ? action.path(alert) : action.path}>{action.text}</Link>
      ) : (
        <Link to={alertURL(alert, alert.rule.id)}>View details</Link>
      )}
    </StatusItem>
  );
};

export default AlertItem;

type StatusItemProps = {
  Icon: React.ComponentType<any>;
  timestamp?: string;
  message: string;
};

type AlertItemProps = {
  alert: Alert;
};
