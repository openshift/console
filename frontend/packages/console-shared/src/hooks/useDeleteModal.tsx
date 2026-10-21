import { useCallback } from 'react';
import type { UseDeleteModal } from '@console/dynamic-plugin-sdk/src';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { useK8sModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sModel';
import { getGroupVersionKindForResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { LazyDeleteModalOverlay } from '@console/internal/components/modals';
import type { DeleteModalProps } from '@console/internal/components/modals/delete-modal';

export const useDeleteModal: UseDeleteModal = (
  resource,
  redirectTo,
  message,
  btnText,
  deleteAllResources,
) => {
  const launchModal = useOverlay();
  const groupVersionKind = getGroupVersionKindForResource(resource);
  const [kind] = useK8sModel(groupVersionKind);
  return useCallback(
    () =>
      resource &&
      kind &&
      launchModal<DeleteModalProps>(LazyDeleteModalOverlay, {
        kind,
        resource,
        redirectTo,
        message,
        btnText,
        deleteAllResources,
      }),
    [resource, kind, launchModal, btnText, deleteAllResources, message, redirectTo],
  );
};
