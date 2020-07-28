import * as _ from 'lodash';
import { Alert } from '@console/internal/components/monitoring/types';
import {
  AlertSeverity,
  AlertStates,
  alertSeverityOrder,
} from '@console/internal/reducers/monitoring';

export const sortMonitoringAlerts = (alerts: Alert[]): Alert[] =>
  _.sortBy(alerts, alertSeverityOrder) as Alert[];

export const getSeverityAlertType = (alerts: Alert[]): AlertSeverity => {
  const sortedAlerts = sortMonitoringAlerts(alerts);
  const severityType = (sortedAlerts[0]?.labels?.severity as AlertSeverity) ?? null;
  return severityType;
};

export const getFiringAlerts = (alerts: Alert[]): Alert[] =>
  _.filter(alerts, (alert) => alert.state === AlertStates.Firing);
