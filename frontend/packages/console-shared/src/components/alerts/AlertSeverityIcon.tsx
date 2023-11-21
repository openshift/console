import * as React from 'react';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import { ExclamationTriangleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
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
            fill: 'var(--pf-v5-global--danger-color--100)',
          }}
        />
      );
    case AlertSeverity.Warning:
    default:
      return (
        <ExclamationTriangleIcon
          style={{
            fontSize,
            fill: 'var(--pf-v5-global--warning-color--100)',
          }}
        />
      );
  }
};

export default AlertSeverityIcon;
