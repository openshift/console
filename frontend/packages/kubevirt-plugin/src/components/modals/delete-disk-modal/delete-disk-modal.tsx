import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
} from '@console/internal/components/factory';
import { HandlePromiseProps, withHandlePromise } from '@console/internal/components/utils';
import { apiVersionForModel, k8sPatch } from '@console/internal/module/k8s';
import { YellowExclamationTriangleIcon } from '@console/shared/src/components/status/icons';
import { getName, getNamespace } from '@console/shared/src/selectors/common';
import { useOwnedVolumeReferencedResources } from '../../../hooks/use-owned-volume-referenced-resources';
import { getRemoveDiskPatches } from '../../../k8s/patches/vm/vm-disk-patches';
import { freeOwnedResources } from '../../../k8s/requests/free-owned-resources';
import { removeHotplugPersistent } from '../../../k8s/requests/vm/actions';
import { DataVolumeModel } from '../../../models';
import { isHotplugDisk } from '../../../selectors/disks/hotplug';
import { isVMRunningOrExpectedRunning } from '../../../selectors/vm/selectors';
import { asVM } from '../../../selectors/vm/vm';
import { getVMLikeModel } from '../../../selectors/vm/vmlike';
import { VMIKind } from '../../../types';
import { V1Disk, V1RemoveVolumeOptions, V1Volume } from '../../../types/api';
import { VMLikeEntityKind } from '../../../types/vmLike';

export const DeleteDiskModal = withHandlePromise((props: DeleteDiskModalProps) => {
  const {
    vmLikeEntity,
    disk,
    volume,
    inProgress,
    errorMessage,
    vmi,
    handlePromise,
    close,
    cancel,
  } = props;
  const { t } = useTranslation();
  const [deleteReferencedResource, setDeleteReferencedResource] = React.useState<boolean>(true);

  const entityModel = getVMLikeModel(vmLikeEntity);
  const namespace = getNamespace(vmLikeEntity);
  const vmName = getName(vmLikeEntity);

  const vmLikeReference = {
    name: vmName,
    kind: entityModel.kind,
    apiVersion: apiVersionForModel(entityModel),
  } as any;

  const volumes = React.useMemo(() => [volume], [volume]);

  const [ownedResources] = useOwnedVolumeReferencedResources(vmLikeReference, namespace, volumes);
  const ownedResource = ownedResources?.length > 0 ? ownedResources[0] : null;
  const isInProgress = inProgress;

  const diskName = disk?.name;

  const removeHotplugRequest: V1RemoveVolumeOptions = {
    name: diskName,
  };

  const submit = (e) => {
    e.preventDefault();

    if (isVMRunningOrExpectedRunning(asVM(vmLikeEntity), vmi)) {
      const promise = removeHotplugPersistent(asVM(vmLikeEntity), removeHotplugRequest).then(() =>
        freeOwnedResources(ownedResources, vmLikeReference, deleteReferencedResource),
      );

      return handlePromise(promise, close);
    }
    const promise = k8sPatch(
      entityModel,
      vmLikeEntity,
      getRemoveDiskPatches(vmLikeEntity, disk),
    ).then(() => freeOwnedResources(ownedResources, vmLikeReference, deleteReferencedResource));
    return handlePromise(promise, close);
  };

  return (
    <form onSubmit={submit} className="modal-content">
      <ModalTitle>
        <YellowExclamationTriangleIcon className="co-icon-space-r" />{' '}
        {isHotplugDisk(vmi, diskName)
          ? t('kubevirt-plugin~Detach {{diskName}} hot-plugged disk', { diskName })
          : t('kubevirt-plugin~Detach {{diskName}} disk', { diskName })}
      </ModalTitle>
      <ModalBody>
        <Trans t={t} ns="kubevirt-plugin">
          Are you sure you want to detach <strong className="co-break-word">{{ diskName }}</strong>{' '}
          disk?
        </Trans>
        {ownedResource && (
          <div className="checkbox">
            <label className="control-label">
              <input
                type="checkbox"
                onChange={() => setDeleteReferencedResource(!deleteReferencedResource)}
                checked={deleteReferencedResource}
              />
              {ownedResource.model === DataVolumeModel
                ? t('kubevirt-plugin~Delete {{ownedResourceName}} {{ownedResourceLabel}} and PVC', {
                    ownedResourceName: getName(ownedResource.resource),
                    ownedResourceLabel: ownedResource.model.label,
                  })
                : t('kubevirt-plugin~Delete {{ownedResourceName}} {{ownedResourceLabel}}', {
                    ownedResourceName: getName(ownedResource.resource),
                    ownedResourceLabel: ownedResource.model.label,
                  })}
            </label>
          </div>
        )}
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMessage}
        submitDisabled={isInProgress}
        inProgress={isInProgress}
        submitText={t('kubevirt-plugin~Detach')}
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
  vmi?: VMIKind;
} & ModalComponentProps &
  HandlePromiseProps;

export const deleteDiskModal = createModalLauncher(DeleteDiskModal);
