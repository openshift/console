import * as React from 'react';
import { ModalComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/ModalProvider';
import { useModal } from '@console/dynamic-plugin-sdk/src/app/modal-support/useModal';
import { UseLabelsModal } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { useK8sModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sModel';
import { getGroupVersionKindForResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { ModalWrapper } from '@console/internal/components/factory/modal';
import { LabelsModal, LabelsModalProps } from '@console/internal/components/modals/labels-modal';

const LabelsModalComponent: ModalComponent<LabelsModalProps> = ({ closeModal, kind, resource }) => {
  return (
    <ModalWrapper blocking onClose={closeModal}>
      <LabelsModal cancel={closeModal} close={closeModal} kind={kind} resource={resource} />
    </ModalWrapper>
  );
};

export const useLabelsModal: UseLabelsModal = (resource) => {
  const launcher = useModal();
  const groupVersionKind = getGroupVersionKindForResource(resource);
  const [kind] = useK8sModel(groupVersionKind);
  return React.useCallback(
    () => resource && kind && launcher<LabelsModalProps>(LabelsModalComponent, { kind, resource }),
    [launcher, kind, resource],
  );
};
