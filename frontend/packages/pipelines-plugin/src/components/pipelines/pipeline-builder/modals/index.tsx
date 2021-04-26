import * as React from 'react';
import { TFunction } from 'i18next';
import { confirmModal } from '@console/internal/components/modals/confirm-modal';
import ModalContent from './ModalContent';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import { global_warning_color_100 as warningColor } from '@patternfly/react-tokens/dist/js/global_warning_color_100';

type ModalCallback = () => void;

export const removeTaskModal = (taskName: string, onRemove: ModalCallback, t: TFunction) => {
  confirmModal({
    title: t('pipelines-plugin~Remove Task'),
    message: (
      <ModalContent
        icon={<ExclamationTriangleIcon size="lg" color={warningColor.value} />}
        title={t('pipelines-plugin~Remove {{taskName}}?', { taskName })}
        message={t('pipelines-plugin~Are you sure you want to remove {{taskName}}?', { taskName })}
      />
    ),
    buttonText: t('pipelines-plugin~Remove'),
    executeFn: () => {
      onRemove();
      return Promise.resolve();
    },
    submitDanger: true,
  });
};
