import * as React from 'react';
import { Stack, StackItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalTitle,
} from '@console/internal/components/factory';
import { BlueInfoCircleIcon, RedExclamationCircleIcon } from '@console/shared';
import { TemplateSourceStatusError } from '../../../statuses/template/types';
import { SourceStatusErrorBody } from '../../vm-templates/vm-template-source';
import { ModalFooter } from '../modal/modal-footer';

type SourceErrorModalProps = ModalComponentProps & {
  sourceStatus: TemplateSourceStatusError;
};

export const SourceErrorModal: React.FC<SourceErrorModalProps> = ({ close, sourceStatus }) => {
  const { t } = useTranslation();

  return (
    <div className="modal-content">
      <ModalTitle>
        <RedExclamationCircleIcon className="co-icon-space-r" />
        {t('kubevirt-plugin~Boot source error')}
      </ModalTitle>
      <ModalBody>
        <Stack hasGutter>
          <StackItem>
            {t('kubevirt-plugin~The boot source for the chosen template is in an error state.')}
          </StackItem>
          <StackItem>
            <SourceStatusErrorBody sourceStatus={sourceStatus} />
          </StackItem>
          <StackItem>
            {t(
              'kubevirt-plugin~Please resolve the boot source before creating a virtual machine from this template.',
            )}
          </StackItem>
        </Stack>
      </ModalBody>
      <ModalFooter onSubmit={close} submitButtonText={t('kubevirt-plugin~Close')} />
    </div>
  );
};

export const SourceNotReadyModal: React.FC<ModalComponentProps> = ({ close }) => {
  const { t } = useTranslation();

  return (
    <div className="modal-content">
      <ModalTitle>
        <BlueInfoCircleIcon className="co-icon-space-r" />
        {t('kubevirt-plugin~Template source not ready')}
      </ModalTitle>
      <ModalBody>
        <Stack hasGutter>
          <StackItem>
            {t('kubevirt-plugin~The boot source for the chosen template is still being prepared')}.
          </StackItem>
          <StackItem>
            {t('kubevirt-plugin~Please wait until it is complete before creating from it')}.
          </StackItem>
        </Stack>
      </ModalBody>
      <ModalFooter onSubmit={close} submitButtonText={t('kubevirt-plugin~Close')} />
    </div>
  );
};

export const sourceErrorModal = createModalLauncher(SourceErrorModal);
export const sourceNotReadyModal = createModalLauncher(SourceNotReadyModal);
