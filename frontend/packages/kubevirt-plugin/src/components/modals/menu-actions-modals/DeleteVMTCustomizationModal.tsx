import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { HandlePromiseProps, withHandlePromise } from '@console/internal/components/utils';
import { YellowExclamationTriangleIcon } from '@console/shared/src/components/status/icons';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  ModalComponentProps,
} from '@console/internal/components/factory';
import { k8sKill } from '@console/internal/module/k8s';

import { VirtualMachineModel } from '../../../models';
import { VMKind } from '../../../types';
import { TEMPLATE_CUSTOMIZED_ANNOTATION } from '../../../constants';

export const DeleteVMTCustomizationModal = withHandlePromise<DeleteVMTCustomizationModal>(
  ({ inProgress, errorMessage, handlePromise, close, cancel, vm }) => {
    const { t } = useTranslation();

    const submit = (event) => {
      event.preventDefault();
      handlePromise(k8sKill(VirtualMachineModel, vm), close);
    };

    return (
      <form onSubmit={submit} className="modal-content">
        <ModalTitle>
          <YellowExclamationTriangleIcon className="co-icon-space-r" />{' '}
          {t('kubevirt-plugin~Delete Virtual Machine Template?')}
        </ModalTitle>
        <ModalBody>
          <Trans t={t} ns="kubevirt-plugin">
            Are you sure you want to delete{' '}
            <strong className="co-break-word">
              {JSON.parse(vm.metadata.annotations[TEMPLATE_CUSTOMIZED_ANNOTATION]).metadata.name}
            </strong>{' '}
            in namespace <strong>{vm.metadata.namespace}</strong>?
          </Trans>
        </ModalBody>
        <ModalSubmitFooter
          errorMessage={errorMessage}
          submitDisabled={inProgress}
          inProgress={inProgress}
          submitText={t('kubevirt-plugin~Delete')}
          submitDanger
          cancel={cancel}
        />
      </form>
    );
  },
);

type DeleteVMTCustomizationModal = {
  vm: VMKind;
} & ModalComponentProps &
  HandlePromiseProps;

const deleteVMTCustomizationModal = createModalLauncher(DeleteVMTCustomizationModal);

export default deleteVMTCustomizationModal;
