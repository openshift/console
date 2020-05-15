import * as React from 'react';
import { HandlePromiseProps, history, withHandlePromise } from '@console/internal/components/utils';
import { YellowExclamationTriangleIcon } from '@console/shared/src/components/status/icons';
import { getName, getNamespace } from '@console/shared/src/selectors/common';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  ModalComponentProps,
} from '@console/internal/components/factory';
import { apiVersionForModel } from '@console/internal/module/k8s';
import { VMLikeEntityKind } from '../../../types/vmLike';
import { asVM, getVMLikeModel, getVolumes } from '../../../selectors/vm';
import { useOwnedVolumeReferencedResources } from '../../../hooks/use-owned-volume-referenced-resources';
import { isTemplate, isVM } from '../../../selectors/check-type';
import { useVirtualMachineImport } from '../../../hooks/use-virtual-machine-import';
import { useUpToDateVMLikeEntity } from '../../../hooks/use-vm-like-entity';
import { VirtualMachineImportModel } from '../../../models';
import { deleteVM } from '../../../k8s/requests/vm';
import { deleteVMTemplate } from '../../../k8s/requests/vmtemplate/actions';

const redirectFn = (vmLikeEntity: VMLikeEntityKind) => {
  // If we are currently on the deleted resource's page, redirect to the resource list page
  const re = new RegExp(`/${getName(vmLikeEntity)}(/|$)`);
  if (re.test(window.location.pathname)) {
    history.push(
      `/k8s/ns/${getNamespace(vmLikeEntity)}/virtualization${
        isTemplate(vmLikeEntity) ? '/templates' : ''
      }`,
    );
  }
};

export const DeleteVMLikeEntityModal = withHandlePromise((props: DeleteVMLikeEntityModalProps) => {
  const { inProgress, errorMessage, handlePromise, close, cancel } = props;
  const vmLikeEntity = useUpToDateVMLikeEntity(props.vmLikeEntity);
  const [deleteDisks, setDeleteDisks] = React.useState<boolean>(true);
  const [deleteVMImport, setDeleteVMImport] = React.useState<boolean>(true);

  const entityModel = getVMLikeModel(vmLikeEntity);
  const namespace = getNamespace(vmLikeEntity);

  const vmLikeReference = {
    name: getName(vmLikeEntity),
    kind: entityModel.kind,
    apiVersion: apiVersionForModel(entityModel),
  } as any;

  const [vmImport, vmImportLoaded] = useVirtualMachineImport(
    isVM(vmLikeEntity) ? vmLikeEntity : null,
  );
  const [ownedVolumeResources, isOwnedVolumeResourcesLoaded] = useOwnedVolumeReferencedResources(
    vmLikeReference,
    namespace,
    getVolumes(asVM(vmLikeEntity), null),
  );
  const isInProgress = inProgress || !vmImportLoaded || !isOwnedVolumeResourcesLoaded;

  const submit = (e) => {
    e.preventDefault();

    let promise;

    if (isVM(vmLikeEntity)) {
      promise = deleteVM(vmLikeEntity, {
        vmImport,
        deleteVMImport,
        ownedVolumeResources,
        deleteOwnedVolumeResources: deleteDisks,
      });
    } else if (isTemplate(vmLikeEntity)) {
      promise = deleteVMTemplate(vmLikeEntity, {
        ownedVolumeResources,
        deleteOwnedVolumeResources: deleteDisks,
      });
    }

    return handlePromise(promise)
      .then(close)
      .then(() => redirectFn(vmLikeEntity));
  };

  return (
    <form onSubmit={submit} className="modal-content">
      <ModalTitle>
        <YellowExclamationTriangleIcon className="co-icon-space-r" /> Delete{' '}
        {isTemplate(vmLikeEntity) ? 'Virtual Machine Template' : entityModel.label}?
      </ModalTitle>
      <ModalBody>
        Are you sure you want to delete{' '}
        <strong className="co-break-word">{getName(vmLikeEntity)}</strong> in namespace{' '}
        <strong>{getNamespace(vmLikeEntity)}</strong> ?
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
        {vmImport && (
          <div className="checkbox">
            <label className="control-label">
              <input
                type="checkbox"
                onChange={() => setDeleteVMImport(!deleteVMImport)}
                checked={deleteVMImport}
              />
              Delete {VirtualMachineImportModel.label} Resource
            </label>
          </div>
        )}
      </ModalBody>
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

export type DeleteVMLikeEntityModalProps = {
  vmLikeEntity: VMLikeEntityKind;
} & ModalComponentProps &
  HandlePromiseProps;

export const deleteVMLikeEntityModal = createModalLauncher(DeleteVMLikeEntityModal);
