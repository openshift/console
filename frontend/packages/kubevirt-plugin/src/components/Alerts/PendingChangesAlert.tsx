import * as React from 'react';
import { Alert, AlertVariant } from '@patternfly/react-core';
import {
  MODAL_INFO_RESTART_IS_REQUIRED,
  MODAL_WARNING_RESTART_IS_REQUIRED,
} from '../../strings/vm/status';

import './PendingChangesAlert.scss';

type PendingChangesAlertProps = {
  warningMsg?: string;
  isWarning?: boolean;
  title?: string;
};

export const PendingChangesAlert: React.FC<PendingChangesAlertProps> = ({
  warningMsg,
  isWarning,
  title,
  children,
}) => (
  <Alert
    title={title || 'Pending Changes'}
    isInline
    variant={isWarning ? AlertVariant.warning : AlertVariant.info}
    className="kv__pending_changes-alert"
  >
    {warningMsg || children}
  </Alert>
);

type ModalPendingChangesAlertProps = {
  isChanged: boolean;
};

export const ModalPendingChangesAlert: React.FC<ModalPendingChangesAlertProps> = ({
  isChanged,
}) => {
  const modalMsg = isChanged ? MODAL_WARNING_RESTART_IS_REQUIRED : MODAL_INFO_RESTART_IS_REQUIRED;
  return (
    <PendingChangesAlert
      warningMsg={modalMsg}
      isWarning={isChanged}
      title="Restart required to apply changes"
    />
  );
};
