import * as React from 'react';
import { StackItem } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
} from '@console/internal/components/factory';
import { HandlePromiseProps, withHandlePromise } from '@console/internal/components/utils';
import { stopVM } from '../../../k8s/requests/vm';
import { getAutoRemovedOrPersistentDiskName } from '../../../selectors/disks/hotplug';
import { VMIKind, VMKind } from '../../../types';
import { RemovalDiskAlert } from '../../vm-disks/RemovalDiskAlert';
import { ActionMessage } from '../../vms/ActionMessage';
import { GracePeriodInput } from './grace-period-input';
import { VMIUsersAlert } from './vmi-users-alert';

export const StopVMModal = withHandlePromise((props: StopVMModalProps) => {
  const { inProgress, errorMessage, handlePromise, close, cancel, vm, vmi, submitDanger } = props;
  const [gracePeriodSeconds, setGracePeriodSeconds] = React.useState<number>(null);
  const { t } = useTranslation();

  const submit = (e) => {
    e.preventDefault();

    let stopOptions;

    if (!_.isNil(gracePeriodSeconds)) stopOptions = { gracePeriodSeconds };

    return handlePromise(stopVM(vm, stopOptions), close);
  };

  return (
    <form onSubmit={submit} className="modal-content">
      <ModalTitle>{t('kubevirt-plugin~Stop')}</ModalTitle>
      <ModalBody>
        <ActionMessage obj={vmi} action={t('kubevirt-plugin~stop')}>
          <StackItem>
            <RemovalDiskAlert
              hotplugDiskNames={getAutoRemovedOrPersistentDiskName(vm, vmi, true)}
            />
          </StackItem>
        </ActionMessage>

        <GracePeriodInput
          gracePeriodSeconds={gracePeriodSeconds}
          setGracePeriodSeconds={setGracePeriodSeconds}
        />
      </ModalBody>
      <VMIUsersAlert vmi={vmi} cancel={cancel} alertTitle={t('kubevirt-plugin~Stop alert')} />
      <ModalSubmitFooter
        errorMessage={errorMessage}
        submitDisabled={inProgress}
        inProgress={inProgress}
        submitText={t('kubevirt-plugin~Stop')}
        submitDanger={submitDanger}
        cancel={cancel}
        cancelText={t('kubevirt-plugin~Cancel')}
      />
    </form>
  );
});

export type StopVMModalProps = {
  vmi: VMIKind;
  vm: VMKind;
  submitDanger?: boolean;
} & ModalComponentProps &
  HandlePromiseProps;

export const stopVMModal = createModalLauncher(StopVMModal);
