import * as _ from 'lodash';
import { Alert, AlertSeverity, AlertStates } from '@console/internal/components/monitoring/types';
import { alertSeverityOrder } from '@console/internal/reducers/monitoring';

export const sortMonitoringAlerts = (alerts: Alert[]): Alert[] =>
  _.sortBy(alerts, alertSeverityOrder) as Alert[];

export const getSeverityAlertType = (alerts: Alert[]): AlertSeverity => {
  const sortedAlerts = sortMonitoringAlerts(alerts);
  const severityType = (sortedAlerts[0]?.labels?.severity as AlertSeverity) ?? AlertSeverity.None;
  return severityType;
};

export const getFiringAlerts = (alerts: Alert[]): Alert[] =>
  _.filter(alerts, (alert) => alert.state === AlertStates.Firing);

export const shouldHideMonitoringAlertDecorator = (severityAlertType: AlertSeverity): boolean =>
  severityAlertType === AlertSeverity.None || severityAlertType === AlertSeverity.Info;
