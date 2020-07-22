import * as React from 'react';
import { apiVersionForModel } from '@console/internal/module/k8s';
import { HandlePromiseProps, withHandlePromise } from '@console/internal/components/utils';
import { YellowExclamationTriangleIcon } from '@console/shared/src/components/status/icons';
import { getName, getNamespace } from '@console/shared/src/selectors/common';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  ModalComponentProps,
} from '@console/internal/components/factory';
import { getVMIVolumes } from '../../../selectors/vmi';
import { VMIKind } from '../../../types';
import { deleteVMI } from '../../../k8s/requests/vmi/actions';
import { useOwnedVolumeReferencedResources } from '../../../hooks/use-owned-volume-referenced-resources';
import { useUpToDateVMLikeEntity } from '../../../hooks/use-vm-like-entity';
import { VirtualMachineInstanceModel } from '../../../models';
import { redirectToList } from './utils';
import { VMIUsersAlert } from './vmi-users-alert';

export const DeleteVMIModal = withHandlePromise((props: DeleteVMIProps) => {
  const { inProgress, errorMessage, handlePromise, close, cancel, vmi } = props;

  const vmiUpToDate = useUpToDateVMLikeEntity<VMIKind>(vmi);
  const [deleteDisks, setDeleteDisks] = React.useState<boolean>(true);

  const namespace = getNamespace(vmiUpToDate);
  const name = getName(vmiUpToDate);

  const vmiReference = {
    name,
    kind: VirtualMachineInstanceModel.kind,
    apiVersion: apiVersionForModel(VirtualMachineInstanceModel),
  } as any;

  const [ownedVolumeResources, isOwnedVolumeResourcesLoaded] = useOwnedVolumeReferencedResources(
    vmiReference,
    namespace,
    getVMIVolumes(vmiUpToDate, null),
  );
  const isInProgress = inProgress || !isOwnedVolumeResourcesLoaded;
  const numOfAllResources = ownedVolumeResources.length;

  const submit = (e) => {
    e.preventDefault();

    const promise = deleteVMI(vmiUpToDate, {
      ownedVolumeResources,
      deleteOwnedVolumeResources: deleteDisks,
    });

    return handlePromise(promise, () => {
      close();
      redirectToList(vmiUpToDate);
    });
  };

  const alertHref = `/k8s/ns/${namespace}/virtualmachineinstances/${name}/details#logged-in-users`;

  return (
    <form onSubmit={submit} className="modal-content">
      <ModalTitle>
        <YellowExclamationTriangleIcon className="co-icon-space-r" /> Delete Virtual Machine
        Instance?
      </ModalTitle>
      <ModalBody>
        Are you sure you want to delete <strong className="co-break-word">{name}</strong> in
        namespace <strong>{namespace}</strong>?
        {numOfAllResources > 0 && (
          <p>
            The following resources will be deleted along with this virtual machine instance.
            Unchecked items will not be deleted.
          </p>
        )}
        {ownedVolumeResources.length > 0 && (
          <div className="checkbox">
            <label className="control-label">
              <input
                type="checkbox"
                onChange={() => setDeleteDisks(!deleteDisks)}
                checked={deleteDisks}
              />
              Delete Disks ({ownedVolumeResources.length}x)
            </label>
          </div>
        )}
      </ModalBody>
      <VMIUsersAlert
        vmi={vmiUpToDate}
        cancel={cancel}
        alertTitle="Delete Virtual Machine Instance alert"
        alertHref={alertHref}
      />
      <ModalSubmitFooter
        errorMessage={errorMessage}
        submitDisabled={isInProgress}
        inProgress={isInProgress}
        submitText="Delete"
        submitDanger
        cancel={cancel}
      />
    </form>
  );
});

export type DeleteVMIProps = {
  vmi: VMIKind;
} & ModalComponentProps &
  HandlePromiseProps;

export const deleteVMIModal = createModalLauncher(DeleteVMIModal);
