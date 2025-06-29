import * as React from 'react';
import { Button, ButtonVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom-v5-compat';
import { isAlertAction, AlertAction, useResolvedExtensions } from '@console/dynamic-plugin-sdk';
import { AlertItemProps } from '@console/dynamic-plugin-sdk/src/api/internal-types';
import { useModal } from '@console/dynamic-plugin-sdk/src/lib-core';
import { alertURL } from '@console/internal/components/monitoring/utils';
import { getAlertActions } from '@console/internal/components/notification-drawer';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import {
  RedExclamationCircleIcon,
  BlueInfoCircleIcon,
  YellowExclamationTriangleIcon,
} from '../../status/icons';
import {
  getAlertSeverity,
  getAlertMessage,
  getAlertDescription,
  getAlertTime,
  getAlertSummary,
  getAlertName,
} from './alert-utils';

const CriticalIcon = () => {
  const { t } = useTranslation();
  return <RedExclamationCircleIcon title={t('public~Critical')} />;
};
const InfoIcon = () => {
  const { t } = useTranslation();
  return <BlueInfoCircleIcon title={t('public~Info')} />;
};
const WarningIcon = () => {
  const { t } = useTranslation();
  return <YellowExclamationTriangleIcon title={t('public~Warning')} />;
};
const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'critical':
      return CriticalIcon;
    case 'info':
      return InfoIcon;
    case 'warning':
    default:
      return WarningIcon;
  }
};

export const StatusItem: React.FC<StatusItemProps> = ({
  name,
  documentationLink,
  Icon,
  timestamp,
  message,
  children,
}) => {
  const { t } = useTranslation();
  return (
    <div className="co-status-card__alert-item">
      <div className="co-status-card__alert-item-icon co-dashboard-icon">
        <Icon />
      </div>
      <div className="co-status-card__alert-item-text">
        <div className="co-status-card__alert-item-message">
          {name && <span className="co-status-card__alert-item-header">{name}</span>}
          {timestamp && (
            <div
              className="co-health-card__alert-item-timestamp co-status-card__health-item-text pf-v6-u-text-color-subtle"
              data-test="timestamp"
            >
              <Timestamp simple timestamp={timestamp} />
            </div>
          )}
          <span className="co-status-card__health-item-text co-break-word">{message}</span>
          {documentationLink && (
            <ExternalLink className="co-status-card__alert-item-doc-link" href={documentationLink}>
              {t('console-shared~Go to documentation')}
            </ExternalLink>
          )}
        </div>
        {children && <div className="co-status-card__alert-item-more">{children}</div>}
      </div>
    </div>
  );
};

const AlertItem: React.FC<AlertItemProps> = ({ alert, documentationLink }) => {
  const { t } = useTranslation();
  const launchModal = useModal();
  const [actionExtensions] = useResolvedExtensions<AlertAction>(
    React.useCallback(
      (e): e is AlertAction => isAlertAction(e) && e.properties.alert === alert.rule.name,
      [alert],
    ),
  );
  const navigate = useNavigate();
  const alertName = getAlertName(alert);
  const actionObj = getAlertActions(actionExtensions, navigate).get(alert.rule.name);
  const { text, action } = actionObj || {};
  return (
    <StatusItem
      Icon={getSeverityIcon(getAlertSeverity(alert))}
      timestamp={getAlertTime(alert)}
      message={getAlertDescription(alert) || getAlertMessage(alert) || getAlertSummary(alert)}
      documentationLink={documentationLink}
      name={alertName}
    >
      {text && action ? (
        <Button variant={ButtonVariant.link} onClick={() => action(alert, launchModal)} isInline>
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
  name?: string;
  documentationLink?: string;
};
