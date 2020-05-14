import * as _ from 'lodash';
import * as React from 'react';
import { HandlePromiseProps, withHandlePromise } from '@console/internal/components/utils';
import { YellowExclamationTriangleIcon } from '@console/shared/src/components/status/icons';
import { getName, getNamespace, getOwnerReferences } from '@console/shared/src/selectors/common';
import { compareOwnerReference } from '@console/shared/src/utils/owner-references';
import { PersistentVolumeClaimModel } from '@console/internal/models';
import {
  useK8sWatchResource,
  WatchK8sResource,
} from '@console/internal/components/utils/k8s-watch-hook';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  ModalComponentProps,
} from '@console/internal/components/factory';
import {
  apiVersionForModel,
  k8sKill,
  k8sPatch,
  K8sResourceCommon,
} from '@console/internal/module/k8s';
import { VMLikeEntityKind } from '../../../types/vmLike';
import { getVMLikeModel } from '../../../selectors/vm';
import { getRemoveDiskPatches } from '../../../k8s/patches/vm/vm-disk-patches';
import { V1Disk } from '../../../types/vm/disk/V1Disk';
import { V1Volume } from '../../../types/vm/disk/V1Volume';
import { VolumeWrapper } from '../../../k8s/wrapper/vm/volume-wrapper';
import { DataVolumeModel } from '../../../models';
import { PatchBuilder } from '@console/shared/src/k8s';

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

  const volumeWrapper = new VolumeWrapper(volume);
  const entityModel = getVMLikeModel(vmLikeEntity);
  const namespace = getNamespace(vmLikeEntity);
  const resourceReference = volumeWrapper.getReferencedObject();
  const resourceReferenceWatch: WatchK8sResource = React.useMemo(
    () =>
      resourceReference && {
        name: resourceReference.name,
        kind: resourceReference.model.kind, // referenceForModel does not work for basic types like Secret, DataVolume
        namespace,
        isList: false,
      },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [namespace, volume],
  );

  const [referencedResource, loaded, loadError] = useK8sWatchResource<K8sResourceCommon>(
    resourceReferenceWatch,
  );
  const referencedResourceLoaded = loaded || !!loadError;

  const vmReference = {
    name: getName(vmLikeEntity),
    kind: entityModel.kind,
    apiVersion: apiVersionForModel(entityModel),
  } as any;

  const ownsReferencedObject =
    !_.isEmpty(referencedResource) &&
    (getOwnerReferences(referencedResource) || []).some((ownerReference) =>
      compareOwnerReference(ownerReference, vmReference),
    );

  const diskName = disk?.name;
  const entityName = getName(vmLikeEntity);

  const submit = (e) => {
    e.preventDefault();

    const promise = k8sPatch(entityModel, vmLikeEntity, getRemoveDiskPatches(vmLikeEntity, disk));
    return handlePromise(promise)
      .then(() => {
        if (ownsReferencedObject) {
          if (deleteReferencedResource) {
            return k8sKill(resourceReference.model, referencedResource);
          }
          return k8sPatch(resourceReference.model, referencedResource, [
            new PatchBuilder('/metadata/ownerReferences')
              .setListRemove(getOwnerReferences(referencedResource), (ownerReference) =>
                compareOwnerReference(ownerReference, vmReference),
              )
              .build(),
          ]);
        }
        return Promise.resolve();
      })
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
        {ownsReferencedObject && (
          <div className="checkbox">
            <label className="control-label">
              <input
                type="checkbox"
                onChange={() => setDeleteReferencedResource(!deleteReferencedResource)}
                checked={deleteReferencedResource}
              />
              Delete {resourceReference.model.label}
              {resourceReference.model === DataVolumeModel &&
                ` and ${PersistentVolumeClaimModel.label}`}
            </label>
          </div>
        )}
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMessage}
        submitDisabled={inProgress || !referencedResourceLoaded}
        inProgress={inProgress || !referencedResourceLoaded}
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
