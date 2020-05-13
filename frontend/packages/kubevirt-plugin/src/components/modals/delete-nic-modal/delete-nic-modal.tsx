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
import { getRemoveNICPatches } from '../../../k8s/patches/vm/vm-nic-patches';
import { V1NetworkInterface } from '../../../types/vm';

export const DeleteNICModal = withHandlePromise((props: DeleteNICModalProps) => {
  const { vmLikeEntity, nic, inProgress, errorMessage, handlePromise, close, cancel } = props;

  const nicName = nic?.name;
  const entityName = getName(vmLikeEntity);

  const submit = (e) => {
    e.preventDefault();

    const promise = k8sPatch(
      getVMLikeModel(vmLikeEntity),
      vmLikeEntity,
      getRemoveNICPatches(vmLikeEntity, nic),
    );
    return handlePromise(promise).then(close);
  };

  return (
    <form onSubmit={submit} className="modal-content">
      <ModalTitle>
        Delete {nicName} from {entityName}
      </ModalTitle>
      <ModalBody>
        Are you sure you want to delete <strong>{nicName}</strong> from{' '}
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

export type DeleteNICModalProps = {
  nic: V1NetworkInterface;
  vmLikeEntity: VMLikeEntityKind;
} & ModalComponentProps &
  HandlePromiseProps;

export const deleteNICModal = createModalLauncher(DeleteNICModal);
