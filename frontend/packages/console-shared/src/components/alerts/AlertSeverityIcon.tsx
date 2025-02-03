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
            fill: 'var(--pf-t--global--icon--color--status--danger--default)',
          }}
        />
      );
    case AlertSeverity.Warning:
    default:
      return (
        <ExclamationTriangleIcon
          style={{
            fontSize,
            fill: 'var(--pf-t--global--icon--color--status--warning--default)',
          }}
        />
      );
  }
};

export default AlertSeverityIcon;
