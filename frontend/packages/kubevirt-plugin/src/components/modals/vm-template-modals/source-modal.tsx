import * as React from 'react';
import { Stack, StackItem } from '@patternfly/react-core';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalTitle,
} from '@console/internal/components/factory';

import { ModalFooter } from '../modal/modal-footer';
import { TemplateSourceStatusError } from '../../../statuses/template/types';
import { SourceStatusErrorBody } from '../../vm-templates/vm-template-source';
import { BlueInfoCircleIcon, RedExclamationCircleIcon } from '@console/shared';

type SourceErrorModalProps = ModalComponentProps & {
  sourceStatus: TemplateSourceStatusError;
};

export const SourceErrorModal: React.FC<SourceErrorModalProps> = ({ close, sourceStatus }) => (
  <div className="modal-content">
    <ModalTitle>
      <RedExclamationCircleIcon className="co-icon-space-r" />
      Boot source error
    </ModalTitle>
    <ModalBody>
      <Stack hasGutter>
        <StackItem>The boot source for the chosen template is in an error state.</StackItem>
        <StackItem>
          <SourceStatusErrorBody sourceStatus={sourceStatus} />
        </StackItem>
        <StackItem>
          Please resolve the boot source before creating a virtual machine from this template.
        </StackItem>
      </Stack>
    </ModalBody>
    <ModalFooter onSubmit={close} submitButtonText="Close" />
  </div>
);

export const SourceNotReadyModal: React.FC<ModalComponentProps> = ({ close }) => (
  <div className="modal-content">
    <ModalTitle>
      <BlueInfoCircleIcon className="co-icon-space-r" />
      Template source not ready
    </ModalTitle>
    <ModalBody>
      <Stack hasGutter>
        <StackItem>The boot source for the chosen template is still being prepared.</StackItem>
        <StackItem>Please wait until it is complete before creating from it.</StackItem>
      </Stack>
    </ModalBody>
    <ModalFooter onSubmit={close} submitButtonText="Close" />
  </div>
);

export const sourceErrorModal = createModalLauncher(SourceErrorModal);
export const sourceNotReadyModal = createModalLauncher(SourceNotReadyModal);
