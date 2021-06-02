import * as React from 'react';
import { Button, ButtonVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { isAlertAction, AlertAction, useResolvedExtensions } from '@console/dynamic-plugin-sdk';
import { Alert } from '@console/internal/components/monitoring/types';
import { alertURL } from '@console/internal/components/monitoring/utils';
import { getAlertActions } from '@console/internal/components/notification-drawer';
import { Timestamp } from '@console/internal/components/utils/timestamp';
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
          <div
            className="co-health-card__alert-item-timestamp co-status-card__health-item-text text-secondary"
            data-test="timestamp"
          >
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
  const { t } = useTranslation();
  const [actionExtensions] = useResolvedExtensions<AlertAction>(
    React.useCallback(
      (e): e is AlertAction => isAlertAction(e) && e.properties.alert === alert.rule.name,
      [alert],
    ),
  );
  const actionObj = getAlertActions(actionExtensions).get(alert.rule.name);
  const { text, action } = actionObj || {};
  return (
    <StatusItem
      Icon={getSeverityIcon(getAlertSeverity(alert))}
      timestamp={getAlertTime(alert)}
      message={getAlertDescription(alert) || getAlertMessage(alert)}
    >
      {text && action ? (
        <Button variant={ButtonVariant.link} onClick={() => action(alert)} isInline>
          {text}
        </Button>
      ) : (
        <Link to={alertURL(alert, alert.rule.id)}>{t('console-shared~View details')}</Link>
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
