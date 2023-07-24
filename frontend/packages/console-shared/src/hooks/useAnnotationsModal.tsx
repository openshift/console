import * as React from 'react';
import { ModalComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/ModalProvider';
import { useModal } from '@console/dynamic-plugin-sdk/src/app/modal-support/useModal';
import { UseAnnotationsModal } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { useK8sModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sModel';
import { getGroupVersionKindForResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { ModalWrapper } from '@console/internal/components/factory/modal';
import { AnnotationsModal, AnnotationsModalProps } from '@console/internal/components/modals/tags';

const AnnotationsModalComponent: ModalComponent<AnnotationsModalProps> = ({
  closeModal,
  kind,
  resource,
}) => {
  return (
    <ModalWrapper blocking onClose={closeModal}>
      <AnnotationsModal cancel={closeModal} close={closeModal} kind={kind} resource={resource} />
    </ModalWrapper>
  );
};

export const useAnnotationsModal: UseAnnotationsModal = (resource) => {
  const launcher = useModal();
  const groupVersionKind = getGroupVersionKindForResource(resource);
  const [kind] = useK8sModel(groupVersionKind);
  return React.useCallback(
    () =>
      resource &&
      kind &&
      launcher<AnnotationsModalProps>(AnnotationsModalComponent, { kind, resource }),
    [launcher, kind, resource],
  );
};
