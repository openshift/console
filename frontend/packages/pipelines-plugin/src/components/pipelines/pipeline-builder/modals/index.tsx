import * as React from 'react';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import { global_warning_color_100 as warningColor } from '@patternfly/react-tokens/dist/js/global_warning_color_100';
import i18next from 'i18next';
import { confirmModal } from '@console/internal/components/modals/confirm-modal';
import ModalContent from './ModalContent';

type ModalCallback = () => void;

export const removeTaskModal = (taskName: string, onRemove: ModalCallback) => {
  confirmModal({
    title: i18next.t('pipelines-plugin~Remove task'),
    message: (
      <ModalContent
        icon={<ExclamationTriangleIcon size="lg" color={warningColor.value} />}
        title={i18next.t('pipelines-plugin~Remove {{taskName}}?', { taskName })}
        message={i18next.t('pipelines-plugin~Are you sure you want to remove {{taskName}}?', {
          taskName,
        })}
      />
    ),
    buttonText: i18next.t('pipelines-plugin~Remove'),
    executeFn: () => {
      onRemove();
      return Promise.resolve();
    },
    submitDanger: true,
  });
};
