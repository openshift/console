import * as React from 'react';
import { Icon } from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import { t_global_icon_color_status_warning_default as warningColor } from '@patternfly/react-tokens';
import i18next from 'i18next';
import { confirmModal } from '@console/internal/components/modals/confirm-modal';
import ModalContent from './ModalContent';

type ModalCallback = () => void;

export const removeTaskModal = (taskName: string, onRemove: ModalCallback) => {
  confirmModal({
    title: i18next.t('pipelines-plugin~Remove task'),
    message: (
      <ModalContent
        icon={
          <Icon size="lg">
            <ExclamationTriangleIcon color={warningColor.value} />
          </Icon>
        }
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
