import * as React from 'react';
import { Alert, AlertVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

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
}) => {
  const { t } = useTranslation();
  return (
    <Alert
      title={title || t('kubevirt-plugin~Pending Changes')}
      isInline
      variant={isWarning ? AlertVariant.warning : AlertVariant.info}
      className="kv__pending_changes-alert"
    >
      {warningMsg || children}
    </Alert>
  );
};

type ModalPendingChangesAlertProps = {
  isChanged: boolean;
};

export const ModalPendingChangesAlert: React.FC<ModalPendingChangesAlertProps> = ({
  isChanged,
}) => {
  const { t } = useTranslation();
  const modalMsg = isChanged
    ? t("kubevirt-plugin~The changes you've made required this virtual machine to be restarted.")
    : t(
        'kubevirt-plugin~If you make changes to the following settings you will need to restart the virtual machine in order for them to be applied',
      );
  return (
    <PendingChangesAlert
      warningMsg={modalMsg}
      isWarning={isChanged}
      title={t('kubevirt-plugin~Restart required to apply changes')}
    />
  );
};
