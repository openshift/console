import * as React from 'react';
import { HandlePromiseProps, withHandlePromise } from '@console/internal/components/utils';
import { YellowExclamationTriangleIcon } from '@console/shared/src/components/status/icons';
import { getName, getNamespace } from '@console/shared/src/selectors/common';
import { PersistentVolumeClaimModel } from '@console/internal/models';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  ModalComponentProps,
} from '@console/internal/components/factory';
import { apiVersionForModel, k8sPatch } from '@console/internal/module/k8s';
import { VMLikeEntityKind } from '../../../types/vmLike';
import { getVMLikeModel } from '../../../selectors/vm';
import { getRemoveDiskPatches } from '../../../k8s/patches/vm/vm-disk-patches';
import { V1Disk } from '../../../types/vm/disk/V1Disk';
import { V1Volume } from '../../../types/vm/disk/V1Volume';
import { DataVolumeModel } from '../../../models';
import { useOwnedVolumeReferencedResources } from '../../../hooks/use-owned-volume-referenced-resources';
import { freeOwnedResources } from '../../../k8s/requests/free-owned-resources';

export const DeleteDiskModal = withHandlePromise((props: DeleteDiskModalProps) => {
  const {
    vmLikeEntity,
    disk,
    volume,
    inProgress,
    errorMessage,
    handlePromise,
    close,
    cancel,
  } = props;
  const [deleteReferencedResource, setDeleteReferencedResource] = React.useState<boolean>(true);

  const entityModel = getVMLikeModel(vmLikeEntity);
  const namespace = getNamespace(vmLikeEntity);

  const vmReference = {
    name: getName(vmLikeEntity),
    kind: entityModel.kind,
    apiVersion: apiVersionForModel(entityModel),
  } as any;

  const [ownedResources, isOwnedResourcesLoaded] = useOwnedVolumeReferencedResources(
    vmReference,
    namespace,
    [volume],
  );

  const diskName = disk?.name;
  const entityName = getName(vmLikeEntity);

  const submit = (e) => {
    e.preventDefault();

    const promise = k8sPatch(entityModel, vmLikeEntity, getRemoveDiskPatches(vmLikeEntity, disk));
    return handlePromise(promise)
      .then(() => freeOwnedResources(ownedResources, vmReference, deleteReferencedResource))
      .then(close);
  };

  return (
    <form onSubmit={submit} className="modal-content">
      <ModalTitle>
        <YellowExclamationTriangleIcon className="co-icon-space-r" /> Delete {diskName} from{' '}
        {entityName}
      </ModalTitle>
      <ModalBody>
        Are you sure you want to delete <strong className="co-break-word">{diskName}</strong> disk
        from <strong className="co-break-word">{entityName} </strong>?
        {ownedResources.length > 0 && (
          <div className="checkbox">
            <label className="control-label">
              <input
                type="checkbox"
                onChange={() => setDeleteReferencedResource(!deleteReferencedResource)}
                checked={deleteReferencedResource}
              />
              Delete {ownedResources[0].model.label}
              {ownedResources[0].model === DataVolumeModel &&
                ` and ${PersistentVolumeClaimModel.label}`}
            </label>
          </div>
        )}
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMessage}
        submitDisabled={inProgress || !isOwnedResourcesLoaded}
        inProgress={inProgress || !isOwnedResourcesLoaded}
        submitText="Delete Disk"
        submitDanger
        cancel={cancel}
      />
    </form>
  );
});

export type DeleteDiskModalProps = {
  disk: V1Disk;
  volume: V1Volume;
  vmLikeEntity: VMLikeEntityKind;
} & ModalComponentProps &
  HandlePromiseProps;

export const deleteDiskModal = createModalLauncher(DeleteDiskModal);
