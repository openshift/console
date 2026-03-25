import { useCallback } from 'react';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import type { UseAnnotationsModal } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { useK8sModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sModel';
import { getGroupVersionKindForResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { LazyAnnotationsModalOverlay } from '@console/internal/components/modals';
import type { AnnotationsModalProps } from '@console/internal/components/modals/tags';

export const useAnnotationsModal: UseAnnotationsModal = (resource) => {
  const launchModal = useOverlay();
  const groupVersionKind = getGroupVersionKindForResource(resource);
  const [kind] = useK8sModel(groupVersionKind);
  return useCallback(
    () =>
      resource &&
      kind &&
      launchModal<AnnotationsModalProps>(LazyAnnotationsModalOverlay, { kind, resource }),
    [launchModal, kind, resource],
  );
};
