import * as React from 'react';
import { Alert, AlertVariant } from '@patternfly/react-core';
import { MODAL_RESTART_IS_REQUIRED } from '../../strings/vm/status';

import './PendingChangesAlert.scss';

type PendingChangesAlertProps = {
  warningMsg?: string;
};

export const PendingChangesAlert: React.FC<PendingChangesAlertProps> = ({ warningMsg }) => (
  <Alert
    title="Pending Changes"
    isInline
    variant={warningMsg ? AlertVariant.warning : AlertVariant.info}
    className="kv__pending_changes-alert"
  >
    {warningMsg || MODAL_RESTART_IS_REQUIRED}
  </Alert>
);
