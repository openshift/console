import * as React from 'react';
import { Alert, AlertVariant } from '@patternfly/react-core';

import './PendingChangesAlert.scss';

type PendingChangesAlertProps = {
  warningMsg?: string;
  isWarning?: boolean;
};

export const PendingChangesAlert: React.FC<PendingChangesAlertProps> = ({
  warningMsg,
  isWarning,
  children,
}) => (
  <Alert
    title="Pending Changes"
    isInline
    variant={isWarning ? AlertVariant.warning : AlertVariant.info}
    className="kv__pending_changes-alert"
  >
    {warningMsg || children}
  </Alert>
);
