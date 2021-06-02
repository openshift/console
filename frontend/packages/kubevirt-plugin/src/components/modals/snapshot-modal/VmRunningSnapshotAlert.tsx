import * as React from 'react';
import { Alert, AlertVariant, StackItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

const VmRunningSnapshotAlert = (props: VmRunningSnapshotAlertProps) => {
  const { vmName, isVMRunningOrExpectedRunning } = props;
  const { t } = useTranslation();

  if (!isVMRunningOrExpectedRunning) {
    return null;
  }

  return (
    <StackItem>
      <Alert
        variant={AlertVariant.warning}
        isInline
        title={t('kubevirt-plugin~The VM {{vmName}} is still running. It will be powered off.', {
          vmName,
        })}
      />
    </StackItem>
  );
};

export type VmRunningSnapshotAlertProps = {
  vmName: string;
  isVMRunningOrExpectedRunning: boolean;
};

export default VmRunningSnapshotAlert;
