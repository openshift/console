import * as React from 'react';
import { ExclamationTriangleIcon, ExclamationCircleIcon } from '@patternfly/react-icons';
import { AlertSeverity } from '@console/dynamic-plugin-sdk';

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
            fill: 'var(--pf-global--danger-color--100)',
          }}
        />
      );
    case AlertSeverity.Warning:
    default:
      return (
        <ExclamationTriangleIcon
          style={{
            fontSize,
            fill: 'var(--pf-global--warning-color--100)',
          }}
        />
      );
  }
};

export default AlertSeverityIcon;
