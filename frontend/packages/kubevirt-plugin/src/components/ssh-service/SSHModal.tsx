import * as React from 'react';
import { Alert, Checkbox, Stack, StackItem } from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalTitle,
} from '@console/internal/components/factory';
import { ResourceLink } from '@console/internal/components/utils';
import useSSHService from '../../hooks/use-ssh-service';
import { VirtualMachineModel } from '../../models';
import { VMIKind, VMKind } from '../../types';
import { ModalFooter } from '../modals/modal/modal-footer';
import SSHCreateServiceMessage from './SSHCreateService/SSHCreateServiceMessage';
import { createOrDeleteSSHService } from './SSHForm/ssh-form-utils';

import './ssh-modal.scss';

type SSHModalProps = ModalComponentProps & {
  vm: VMIKind | VMKind;
};

const SSHModal: React.FC<SSHModalProps> = ({ vm, close }) => {
  const { t } = useTranslation();
  const { sshServices } = useSSHService(vm);
  const [isEnabled, setEnabled] = React.useState<boolean>(sshServices?.running);

  return (
    <div className="SSHModal-main">
      <ModalTitle>{t('kubevirt-plugin~SSH access')}</ModalTitle>
      <ModalBody>
        <Stack hasGutter>
          <StackItem>
            <Checkbox
              id="ssh-service-checkbox"
              className="kv-ssh-service-checkbox--main"
              label={
                <Trans ns="kubevirt-plugin" t={t}>
                  Expose SSH access for{' '}
                  <ResourceLink
                    inline
                    linkTo={false}
                    kind={VirtualMachineModel.kind}
                    name={vm?.metadata?.name}
                    namespace={vm?.metadata?.namespace}
                  />
                </Trans>
              }
              isChecked={isEnabled}
              onChange={setEnabled}
            />
          </StackItem>
          <StackItem>
            <Alert variant="info" isInline title={t('kubevirt-plugin~Node port')}>
              <SSHCreateServiceMessage />
            </Alert>
          </StackItem>
        </Stack>
      </ModalBody>
      <ModalFooter
        onSubmit={() => {
          createOrDeleteSSHService(vm, isEnabled);
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
