import { useCallback } from 'react';
import { ButtonVariant } from '@patternfly/react-core';
import { useTranslation, Trans } from 'react-i18next';
import { modelFor } from '@console/internal/module/k8s';
import { useWarningModalWithProps } from '@console/shared/src/hooks/useWarningModal';

const useConfirmNavUnpinModal = (pinnedResources: string[], updatePinsFn) => {
  const { t } = useTranslation();

  const confirmModalLauncher = useWarningModalWithProps({
    title: t('console-app~Remove from navigation?'),
    cancelButtonLabel: t('console-app~Cancel'),
    confirmButtonLabel: t('console-app~Remove'),
    confirmButtonVariant: ButtonVariant.danger,
    ouiaId: 'NavigationUnpinConfirmation',
  });

  return useCallback(
    (resource: string) => {
      const onConfirm = () => {
        const updatedPinnedResources = pinnedResources.filter((pin) => pin !== resource);
        updatePinsFn(updatedPinnedResources);
        return Promise.resolve();
      };

      const label = modelFor(resource)?.labelPlural;
      const message = (
        <span>
          <Trans ns="public">
            Are you sure you want to remove <strong>{{ label }}</strong> from navigation?
          </Trans>
        </span>
      );

      confirmModalLauncher({
        children: message,
        onConfirm,
      });
    },
    [pinnedResources, updatePinsFn, confirmModalLauncher],
  );
};

export default useConfirmNavUnpinModal;
