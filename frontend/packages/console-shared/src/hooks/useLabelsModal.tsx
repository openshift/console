import { useCallback } from 'react';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import type { UseLabelsModal } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { useK8sModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sModel';
import { getGroupVersionKindForResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { LazyLabelsModalOverlay } from '@console/internal/components/modals';
import type { LabelsModalProps } from '@console/internal/components/modals/labels-modal';

export const useLabelsModal: UseLabelsModal = (resource) => {
  const launchModal = useOverlay();
  const groupVersionKind = getGroupVersionKindForResource(resource);
  const [kind] = useK8sModel(groupVersionKind);
  return useCallback(
    () =>
      resource && kind && launchModal<LabelsModalProps>(LazyLabelsModalOverlay, { kind, resource }),
    [launchModal, kind, resource],
  );
};
