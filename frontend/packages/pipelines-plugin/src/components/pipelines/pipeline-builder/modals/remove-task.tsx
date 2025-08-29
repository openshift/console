import { useCallback } from 'react';
import { Icon, ButtonVariant } from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import { t_global_icon_color_status_warning_default as warningColor } from '@patternfly/react-tokens';
import { useTranslation } from 'react-i18next';
import { useWarningModalWithProps } from '@console/shared/src/hooks/useWarningModal';
import ModalContent from './ModalContent';

type ModalCallback = () => void;

export const useRemoveTaskModal = () => {
  const { t } = useTranslation();
  const openConfirm = useWarningModalWithProps({
    title: t('pipelines-plugin~Remove task'),
    confirmButtonLabel: t('pipelines-plugin~Remove'),
    cancelButtonLabel: t('public~Cancel'),
    confirmButtonVariant: ButtonVariant.danger,
    ouiaId: 'PipelinesRemoveTaskConfirmation',
  });

  return useCallback(
    (taskName: string, onRemove: ModalCallback) => {
      openConfirm({
        children: (
          <ModalContent
            icon={
              <Icon size="lg">
                <ExclamationTriangleIcon color={warningColor.value} />
              </Icon>
            }
            title={t('pipelines-plugin~Remove {{taskName}}?', { taskName })}
            message={t('pipelines-plugin~Are you sure you want to remove {{taskName}}?', {
              taskName,
            })}
          />
        ),
        onConfirm: () => {
          onRemove();
        },
      });
    },
    [openConfirm, t],
  );
};
