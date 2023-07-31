import * as React from 'react';
import { UseDeleteModal } from '@console/dynamic-plugin-sdk/src';
import { ModalComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/ModalProvider';
import { useModal } from '@console/dynamic-plugin-sdk/src/app/modal-support/useModal';
import { useK8sModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sModel';
import { getGroupVersionKindForResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { ModalWrapper } from '@console/internal/components/factory/modal';
import { DeleteModal, DeleteModalProps } from '@console/internal/components/modals/delete-modal';

const DeleteModalComponent: ModalComponent<DeleteModalProps> = ({
  btnText,
  closeModal,
  deleteAllResources,
  kind,
  message,
  redirectTo,
  resource,
}) => {
  return (
    <ModalWrapper blocking onClose={closeModal}>
      <DeleteModal
        kind={kind}
        resource={resource}
        btnText={btnText}
        cancel={closeModal}
        close={closeModal}
        deleteAllResources={deleteAllResources}
        message={message}
        redirectTo={redirectTo}
      />
    </ModalWrapper>
  );
};

export const useDeleteModal: UseDeleteModal = (
  resource,
  redirectTo,
  message,
  btnText,
  deleteAllResources,
) => {
  const launcher = useModal();
  const groupVersionKind = getGroupVersionKindForResource(resource);
  const [kind] = useK8sModel(groupVersionKind);
  return React.useCallback(
    () =>
      resource &&
      kind &&
      launcher<DeleteModalProps>(DeleteModalComponent, {
        kind,
        resource,
        redirectTo,
        message,
        btnText,
        deleteAllResources,
      }),
    [resource, kind, launcher, btnText, deleteAllResources, message, redirectTo],
  );
};
