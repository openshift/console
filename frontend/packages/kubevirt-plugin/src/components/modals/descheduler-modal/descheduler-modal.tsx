import * as React from 'react';
import { Alert, Checkbox } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalTitle,
} from '@console/internal/components/factory';
import { HandlePromiseProps, withHandlePromise } from '@console/internal/components/utils';
import './descheduler-modal.scss';
import { k8sPatch } from '@console/internal/module/k8s';
import { DESCHEDULER_EVICT_LABEL } from '../../../constants';
import { PatchBuilder } from '../../../k8s/helpers/patch';
import { VirtualMachineModel } from '../../../models';
import { VMKind } from '../../../types';
import { ModalFooter } from '../modal/modal-footer';

type DeschedulerModalProps = {
  isVMdeschedulerOn: boolean;
  vm: VMKind;
} & HandlePromiseProps &
  ModalComponentProps;

export const DeschedulerModal = withHandlePromise<DeschedulerModalProps>(
  ({ isVMdeschedulerOn, vm, handlePromise, close }) => {
    const { t } = useTranslation();
    const [isOn, setOn] = React.useState<boolean>(isVMdeschedulerOn); // the default is OFF, the admin has to opt-in this feature

    const submit = async (event) => {
      event.preventDefault();
      if (isVMdeschedulerOn !== isOn) {
        const templateAnnotations = vm?.spec?.template?.metadata?.annotations;
        templateAnnotations[DESCHEDULER_EVICT_LABEL] = isOn ? 'true' : 'false';

        const patch = [
          new PatchBuilder('/spec/template/metadata/annotations')
            .replace(templateAnnotations)
            .build(),
        ];

        const promise = k8sPatch(VirtualMachineModel, vm, patch);
        handlePromise(promise, close);
      }
      close();
    };

    return (
      <div className="modal-content modal-content--no-inner-scroll">
        <ModalTitle>{t('kubevirt-plugin~Descheduler settings')}</ModalTitle>
        <ModalBody>
          <Checkbox
            id="descheduler-checkbox"
            isChecked={isOn}
            label={t('kubevirt-plugin~Allow the Descheduler to evict the VM via live migration')}
            onChange={setOn}
            className="kubevirt-descheduler-modal__descheduler_content"
          />
          {isOn && (
            <Alert variant="info" isInline title={t('kubevirt-plugin~Active descheduler')}>
              {t(
                'kubevirt-plugin~This VM is subject to the descheduler profiles configured for eviction.',
              )}
            </Alert>
          )}
        </ModalBody>
        <ModalFooter
          inProgress={false}
          submitButtonText={t('kubevirt-plugin~Save')}
          onSubmit={submit}
          onCancel={close}
        />
      </div>
    );
  },
);

export const deschedulerModal = createModalLauncher(DeschedulerModal);
