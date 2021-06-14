import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalTitle,
} from '@console/internal/components/factory';
import { VMIKind, VMKind } from '@console/kubevirt-plugin/src/types';
import useSSHService from '../../hooks/use-ssh-service';
import { ModalFooter } from '../modals/modal/modal-footer';
import SSHCreateService from './SSHCreateService/SSHCreateService';

import './ssh-modal.scss';

type SSHModalProps = ModalComponentProps & {
  vm: VMIKind | VMKind;
};
const SSHModal: React.FC<SSHModalProps> = ({ vm, close }) => {
  const { t } = useTranslation();
  const { createOrDeleteSSHService } = useSSHService(vm);
  return (
    <div className="SSHModal-main">
      <ModalTitle>{t('kubevirt-plugin~SSH access')}</ModalTitle>
      <ModalBody>
        <SSHCreateService vmName={vm?.metadata?.name} disableAuthorizedKeyMessage hidePopup />
      </ModalBody>
      <ModalFooter
        onSubmit={() => {
          createOrDeleteSSHService(vm);
          close();
        }}
        onCancel={close}
        submitButtonText={t('kubevirt-plugin~Save')}
        cancelButtonText={t('kubevirt-plugin~Close')}
      />
    </div>
  );
};

export default createModalLauncher(SSHModal);
