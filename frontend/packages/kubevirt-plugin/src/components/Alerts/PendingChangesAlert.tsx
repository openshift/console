import * as React from 'react';
import { Alert, AlertVariant } from '@patternfly/react-core';
import { MODAL_RESTART_IS_REQUIRED } from '../../strings/vm/status';

import './PendingChangesAlert.scss';

export const PendingChangesAlert = () => (
  <Alert
    title="Pending Changes"
    isInline
    variant={AlertVariant.info}
    className="kv__pending_changes-alert"
  >
    {MODAL_RESTART_IS_REQUIRED}
  </Alert>
);
