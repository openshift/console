import type { FC, ReactElement } from 'react';
import { ExclamationCircleIcon, ExclamationTriangleIcon } from '@patternfly/react-icons';
import { AlertSeverity } from '@console/dynamic-plugin-sdk';

interface AlertSeverityIconProps {
  severityAlertType: AlertSeverity;
  fontSize?: number;
}

const AlertSeverityIcon: FC<AlertSeverityIconProps> = ({
  severityAlertType,
  fontSize,
}): ReactElement => {
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
