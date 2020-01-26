import * as React from 'react';
import { confirmModal } from '@console/internal/components/modals/confirm-modal';
import ModalContent from './ModalContent';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import { global_warning_color_100 as warningColor } from '@patternfly/react-tokens';

type ModalCallback = () => void;

export const removeTaskModal = (taskName: string, onRemove: ModalCallback) => {
  confirmModal({
    title: 'Remove Task',
    message: (
      <ModalContent
        icon={<ExclamationTriangleIcon size="lg" color={warningColor.value} />}
        title={`Remove ${taskName}?`}
        message={`Are you sure you want to remove ${taskName}?`}
      />
    ),
    buttonText: 'Remove',
    executeFn: () => {
      onRemove();
      return Promise.resolve();
    },
    submitDanger: true,
  });
};

export const warnAction = (
  modalHeader: string,
  title: string,
  message: string,
  onAccept: ModalCallback,
) => {
  confirmModal({
    title: modalHeader,
    message: (
      <ModalContent
        icon={<ExclamationTriangleIcon size="lg" color={warningColor.value} />}
        title={title}
        message={message}
      />
    ),
    buttonText: 'Confirm',
    executeFn: () => {
      onAccept();
      return Promise.resolve();
    },
  });
};
