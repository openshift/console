import * as React from 'react';
import { HandlePromiseProps, withHandlePromise } from '@console/internal/components/utils';
import { getName, getNamespace, getRandomChars } from '@console/shared';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalTitle,
} from '@console/internal/components/factory';
import { k8sCreate } from '@console/internal/module/k8s';
import { RESTORE_SNAPSHOT, RESTORE } from '../../../utils/strings';
import { ModalFooter } from '../modal/modal-footer';
import { VMRestoreWrapper } from '../../../k8s/wrapper/vm/vm-restore-wrapper';
import { VMSnapshot } from '../../../types';
import { getVmSnapshotVmName } from '../../../selectors/snapshot/snapshot';

const SnapshotRestoreModal = withHandlePromise((props: SnapshotRestoreModalProps) => {
  const { snapshot, inProgress, errorMessage, handlePromise, close, cancel } = props;
  const snapshotName = getName(snapshot);

  const submit = async (e) => {
    e.preventDefault();
    const restoreName = `${snapshotName}-restore-${getRandomChars()}`;
    const namespace = getNamespace(snapshot);
    const snapshotRestoreWrapper = new VMRestoreWrapper().init({
      name: restoreName,
      namespace,
      snapshotName,
      vmName: getVmSnapshotVmName(snapshot),
    });

    handlePromise(
      k8sCreate(snapshotRestoreWrapper.getModel(), snapshotRestoreWrapper.asResource()),
      () => {
        close();
      },
    );
  };

  return (
    <div className="modal-content">
      <ModalTitle>{RESTORE_SNAPSHOT}</ModalTitle>
      <ModalBody>
        Are you sure you want to restore <strong className="co-break-word">{snapshotName}</strong>{' '}
        snapshot?
      </ModalBody>
      <ModalFooter
        id="snapshot"
        submitButtonText={RESTORE}
        errorMessage={errorMessage}
        isDisabled={inProgress}
        inProgress={inProgress}
        onSubmit={submit}
        onCancel={(e) => {
          e.stopPropagation();
          cancel();
        }}
      />
    </div>
  );
});

export default createModalLauncher(SnapshotRestoreModal);

export type SnapshotRestoreModalProps = {
  snapshot: VMSnapshot;
} & ModalComponentProps &
  HandlePromiseProps;
