import { getAlerts as getPrometheusAlerts } from '@console/shared/src/selectors/monitoring';
import { Alert, PrometheusRulesResponse } from '@console/shared/src/types/monitoring';

export const getAlertSeverity = (alert: Alert) =>
  alert && alert.labels ? alert.labels.severity : null;
export const getAlertMessage = (alert: Alert) =>
  alert && alert.annotations ? alert.annotations.message : null;
export const getAlertDescription = (alert: Alert) =>
  alert && alert.annotations ? alert.annotations.description : null;
export const getAlertTime = (alert: Alert) => (alert ? alert.activeAt : null);
export const getAlertName = (alert: Alert) =>
  alert && alert.labels ? alert.labels.alertname : null;

export const getAlerts = (alertsResults: PrometheusRulesResponse): Alert[] =>
  alertsResults
    ? getPrometheusAlerts(alertsResults.data)
        .filter((a) => a.state === 'firing' && getAlertName(a) !== 'Watchdog')
        .sort((a, b) => +new Date(getAlertTime(b)) - +new Date(getAlertTime(a)))
    : [];
