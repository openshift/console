import { Alert } from '@console/dynamic-plugin-sdk';

export const getAlertSeverity = (alert: Alert) =>
  alert && alert.labels ? alert.labels.severity : null;
export const getAlertMessage = (alert: Alert) =>
  alert && alert.annotations ? alert.annotations.message : null;
export const getAlertDescription = (alert: Alert) =>
  alert && alert.annotations ? alert.annotations.description : null;
export const getAlertSummary = (alert: Alert) => alert?.annotations?.summary || null;
export const getAlertTime = (alert: Alert) => (alert ? alert.activeAt : null);
export const getAlertName = (alert: Alert) =>
  alert && alert.labels ? alert.labels.alertname : null;
