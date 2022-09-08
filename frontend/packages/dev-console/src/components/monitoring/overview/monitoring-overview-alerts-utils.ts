import { AlertSeverity } from '@console/dynamic-plugin-sdk';

export const getAlertType = (severity: string): 'danger' | 'warning' | 'info' => {
  switch (severity) {
    case AlertSeverity.Critical: {
      return 'danger';
    }
    case AlertSeverity.Info:
    case AlertSeverity.None: {
      return 'info';
    }
    case AlertSeverity.Warning:
    default: {
      return 'warning';
    }
  }
};
