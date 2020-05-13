import * as React from 'react';
import { HandlePromiseProps, withHandlePromise } from '@console/internal/components/utils';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  ModalComponentProps,
} from '@console/internal/components/factory';
import { k8sPatch } from '@console/internal/module/k8s';
import { getName } from '@console/shared';
import { VMLikeEntityKind } from '../../../types/vmLike';
import { getVMLikeModel } from '../../../selectors/vm';
import { getRemoveDiskPatches } from '../../../k8s/patches/vm/vm-disk-patches';
import { V1Disk } from '../../../types/vm/disk/V1Disk';

export const DeleteDiskModal = withHandlePromise((props: DeleteDiskModalProps) => {
  const { vmLikeEntity, disk, inProgress, errorMessage, handlePromise, close, cancel } = props;

  const diskName = disk?.name;
  const entityName = getName(vmLikeEntity);

  const submit = (e) => {
    e.preventDefault();

    const promise = k8sPatch(
      getVMLikeModel(vmLikeEntity),
      vmLikeEntity,
      getRemoveDiskPatches(vmLikeEntity, disk),
    );
    return handlePromise(promise).then(close);
  };

  return (
    <form onSubmit={submit} className="modal-content">
      <ModalTitle>
        Delete {diskName} from {entityName}
      </ModalTitle>
      <ModalBody>
        Are you sure you want to delete <strong>{diskName}</strong> from{' '}
        <strong>{entityName} </strong>?
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMessage}
        inProgress={inProgress}
        submitText="Delete"
        cancel={cancel}
      />
    </form>
  );
});

export type DeleteDiskModalProps = {
  disk: V1Disk;
  vmLikeEntity: VMLikeEntityKind;
} & ModalComponentProps &
  HandlePromiseProps;

export const deleteDiskModal = createModalLauncher(DeleteDiskModal);
