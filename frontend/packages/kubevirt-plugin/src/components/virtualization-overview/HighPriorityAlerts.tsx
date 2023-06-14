import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { AlertSeverity } from '@console/dynamic-plugin-sdk';
import { ExternalLink } from '@console/internal/components/utils';
import useFilteredAlerts from '../../hooks/useFilteredAlerts';

import './high-priority-alerts.scss';

const OPERATOR_LABEL_KEY = 'kubernetes_operator_part_of';
const isKubeVirtAlert = (alert) => alert?.labels?.[OPERATOR_LABEL_KEY] === 'kubevirt';
const isHighPriorityAlert = (alert) => alert?.labels?.priority === 'high';
const isKubeVirtHighPriorityAlert = (alert) => isKubeVirtAlert(alert) && isHighPriorityAlert(alert);

enum AlertVariant {
  Warning = 'warning',
  Danger = 'danger',
  Info = 'info',
  Default = 'default',
}

const asAlertVariant = (severity: AlertSeverity) => {
  switch (severity) {
    case AlertSeverity.Warning:
      return AlertVariant.Warning;
    case AlertSeverity.Critical:
      return AlertVariant.Danger;
    case AlertSeverity.Info:
      return AlertVariant.Info;
    case AlertSeverity.None:
    default:
      return AlertVariant.Default;
  }
};

const AlertTitle = ({ alert }) => {
  const { t } = useTranslation();
  const message = alert?.annotations?.message || alert?.annotations?.summary;
  const runbookURL = alert?.annotations?.runbook_url;

  return (
    <>
      {message}{' '}
      {runbookURL && <ExternalLink href={runbookURL} text={t('kubevirt-plugin~Runbook')} />}
    </>
  );
};

const HighPriorityAlerts: React.FC = () => {
  const [filteredAlerts] = useFilteredAlerts(isKubeVirtHighPriorityAlert);

  return (
    <div className="kv-high-priority-alerts">
      {filteredAlerts.map((alert) => {
        const severity = alert?.labels?.severity as AlertSeverity;
        return (
          <Alert
            isInline
            variant={asAlertVariant(severity)}
            title={<AlertTitle alert={alert} />}
            className="kv-high-priority-alerts__alert"
          />
        );
      })}
    </div>
  );
};

export default HighPriorityAlerts;
