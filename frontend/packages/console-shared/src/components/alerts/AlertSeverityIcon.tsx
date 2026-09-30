import type { FC, ReactElement } from 'react';
import { RhUiErrorFillIcon, RhUiWarningFillIcon } from '@patternfly/react-icons';
import { AlertSeverity } from '@console/dynamic-plugin-sdk';

interface AlertSeverityIconProps {
  severityAlertType: AlertSeverity;
  fontSize?: number;
}

export const AlertSeverityIcon: FC<AlertSeverityIconProps> = ({
  severityAlertType,
  fontSize,
}): ReactElement => {
  switch (severityAlertType) {
    case AlertSeverity.Critical:
      return (
        <RhUiErrorFillIcon
          style={{
            fontSize,
            fill: 'var(--pf-t--global--icon--color--status--danger--default)',
          }}
        />
      );
    case AlertSeverity.Warning:
    default:
      return (
        <RhUiWarningFillIcon
          style={{
            fontSize,
            fill: 'var(--pf-t--global--icon--color--status--warning--default)',
          }}
        />
      );
  }
};
