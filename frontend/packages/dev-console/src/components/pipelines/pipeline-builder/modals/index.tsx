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

export const warnYAML = (onAccept: ModalCallback) => {
  confirmModal({
    message: (
      <ModalContent
        icon={<ExclamationTriangleIcon size="lg" color={warningColor.value} />}
        title="Switch to YAML Editor?"
        message="Your changes will be lost if you continue. Are you sure you want to leave this form?"
      />
    ),
    submitDanger: true,
    btnText: 'Continue',
    executeFn: () => {
      onAccept();
      return Promise.resolve();
    },
  });
};
