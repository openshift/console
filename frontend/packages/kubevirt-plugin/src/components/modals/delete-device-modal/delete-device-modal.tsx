import * as React from 'react';
import { withHandlePromise } from '@console/internal/components/utils';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory';
import { k8sPatch } from '@console/internal/module/k8s';
import { getName } from '@console/shared';
import { VMLikeEntityKind } from '../../../types/vmLike';
import { getVMLikeModel } from '../../../selectors/vm';
import { getRemoveDiskPatches } from '../../../k8s/patches/vm/vm-disk-patches';
import { getRemoveNICPatches } from '../../../k8s/patches/vm/vm-nic-patches';

export enum DeviceType {
  NIC = 'NIC',
  DISK = 'DISK',
}

export const DeleteDeviceModal = withHandlePromise((props: DeleteDeviceModalProps) => {
  const {
    vmLikeEntity,
    device,
    deviceType,
    inProgress,
    errorMessage,
    handlePromise,
    close,
    cancel,
  } = props;

  const deviceName = device.name;
  const entityName = getName(vmLikeEntity);

  const submit = (e) => {
    e.preventDefault();

    let patches;
    switch (deviceType) {
      case DeviceType.DISK:
        patches = getRemoveDiskPatches(vmLikeEntity, device);
        break;
      case DeviceType.NIC:
        patches = getRemoveNICPatches(vmLikeEntity, device);
        break;
      default:
        return;
    }

    if (!patches || patches.length === 0) {
      close();
    } else {
      const promise = k8sPatch(getVMLikeModel(vmLikeEntity), vmLikeEntity, patches);
      handlePromise(promise).then(close); // eslint-disable-line promise/catch-or-return
    }
  };

  return (
    <form onSubmit={submit} className="modal-content">
      <ModalTitle>
        Delete {deviceName} from {entityName}
      </ModalTitle>
      <ModalBody>
        Are you sure you want to delete <strong>{deviceName}</strong> from{' '}
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

export type DeleteDeviceModalProps = {
  deviceType: DeviceType;
  device: any;
  vmLikeEntity: VMLikeEntityKind;
  handlePromise: <T>(promise: Promise<T>) => Promise<T>;
  inProgress: boolean;
  errorMessage: string;
  cancel?: () => void;
  close?: () => void;
};

export const deleteDeviceModal = createModalLauncher(DeleteDeviceModal);
