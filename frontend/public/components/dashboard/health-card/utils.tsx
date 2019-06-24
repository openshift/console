import * as _ from 'lodash-es';
import { Alert } from '../../monitoring';
import { ALERTS_KEY } from '../../../actions/dashboards';

export const getAlertSeverity = (alert: Alert): string => _.get(alert, 'labels.severity');
export const getAlertMessage = (alert: Alert): string => _.get(alert, 'annotations.message');
export const getAlertDescription = (alert: Alert): string => _.get(alert, 'annotations.description');

export const filterAlerts = (alerts: Alert[]): Alert[] =>
  alerts.filter(alert => _.get(alert, 'labels.alertname') !== 'Watchdog');

export const getAlerts = (alertsResults: any): Alert[] => {
  const alertsResponse = alertsResults ? alertsResults.getIn([ALERTS_KEY, 'result'], []) : [];
  return Array.isArray(alertsResponse) ? filterAlerts(alertsResponse) : [];
};
