import { AlertSeverity } from '@console/internal/reducers/monitoring';

export const getAlertType = (severity: string): 'danger' | 'warning' | 'info' => {
  switch (severity) {
    case AlertSeverity.Critical: {
      return 'danger';
    }
    case AlertSeverity.Warning: {
      return 'warning';
    }
    default: {
      return 'info';
    }
  }
};
