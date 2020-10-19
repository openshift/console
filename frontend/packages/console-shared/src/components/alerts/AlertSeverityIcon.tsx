import * as React from 'react';
import { ExclamationTriangleIcon, ExclamationCircleIcon } from '@patternfly/react-icons';
import { AlertSeverity } from '@console/internal/components/monitoring/types';

interface AlertSeverityIconProps {
  severityAlertType: AlertSeverity;
  fontSize?: number;
}

const AlertSeverityIcon: React.FC<AlertSeverityIconProps> = ({
  severityAlertType,
  fontSize,
}): React.ReactElement => {
  switch (severityAlertType) {
    case AlertSeverity.Critical:
      return (
        <ExclamationCircleIcon
          style={{
            fontSize,
            color: 'var(--pf-global--danger-color--100)',
          }}
          title="Monitoring Alert"
        />
      );
    case AlertSeverity.Warning:
      return (
        <ExclamationTriangleIcon
          style={{
            fontSize,
            color: 'var(--pf-global--warning-color--100)',
          }}
          title="Monitoring Alert"
        />
      );
    default:
      return null;
  }
};

export default AlertSeverityIcon;
