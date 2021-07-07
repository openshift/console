import * as React from 'react';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
} from '@console/internal/components/factory';
import { HandlePromiseProps, withHandlePromise } from '@console/internal/components/utils';
import {
  useK8sWatchResource,
  WatchK8sResource,
} from '@console/internal/components/utils/k8s-watch-hook';
import { YellowExclamationTriangleIcon } from '@console/shared/src/components/status/icons';
import { useOwnedVolumeReferencedResources } from '../../../hooks/use-owned-volume-referenced-resources';
import { useVirtualMachineImport } from '../../../hooks/use-virtual-machine-import';
import { useUpToDateVMLikeEntity } from '../../../hooks/use-vm-like-entity';
import { deleteVM } from '../../../k8s/requests/vm';
import {
  VirtualMachineImportModel,
  VirtualMachineModel,
  VirtualMachineSnapshotModel,
} from '../../../models';
import {
  getKubevirtModelAvailableAPIVersion,
  kubevirtReferenceForModel,
} from '../../../models/kubevirtReferenceForModel';
import { getName, getNamespace } from '../../../selectors';
import { getVmSnapshotVmName } from '../../../selectors/snapshot/snapshot';
import { getVolumes } from '../../../selectors/vm';
import { VMIKind, VMKind, VMSnapshot } from '../../../types/vm';
import { redirectToList } from './utils';
import { VMIUsersAlert } from './vmi-users-alert';

export const DeleteVMModal = withHandlePromise((props: DeleteVMModalProps) => {
  const { inProgress, errorMessage, handlePromise, close, cancel, vm, vmi } = props;

  const snapshotResource: WatchK8sResource = {
    isList: true,
    kind: kubevirtReferenceForModel(VirtualMachineSnapshotModel),
    namespaced: true,
    namespace: getNamespace(vm),
  };

  const vmUpToDate = useUpToDateVMLikeEntity<VMKind>(vm);
  const { t } = useTranslation();
  const [deleteDisks, setDeleteDisks] = React.useState<boolean>(true);
  const [deleteVMImport, setDeleteVMImport] = React.useState<boolean>(true);
  const [snapshots] = useK8sWatchResource<VMSnapshot[]>(snapshotResource);
  const vmHasSnapshots = snapshots.some((snap) => getVmSnapshotVmName(snap) === getName(vm));

  const namespace = getNamespace(vmUpToDate);
  const name = getName(vmUpToDate);

  const vmReference = {
    name,
    kind: VirtualMachineModel.kind,
    apiVersion: getKubevirtModelAvailableAPIVersion(VirtualMachineModel),
  } as any;

  const [vmImport, vmImportLoaded] = useVirtualMachineImport(vmUpToDate);
  const [ownedVolumeResources, isOwnedVolumeResourcesLoaded] = useOwnedVolumeReferencedResources(
    vmReference,
    namespace,
    getVolumes(vmUpToDate, null),
  );
  const isInProgress = inProgress || !vmImportLoaded || !isOwnedVolumeResourcesLoaded;
  const numOfAllResources = _.sum([ownedVolumeResources.length, vmImport ? 1 : 0]);

  const submit = (e) => {
    e.preventDefault();

    const promise = deleteVM(vmUpToDate, {
      vmImport,
      deleteVMImport,
      ownedVolumeResources,
      deleteOwnedVolumeResources: deleteDisks,
    });

    return handlePromise(promise, () => {
      close();
      redirectToList(vmUpToDate);
    });
  };

  return (
    <form onSubmit={submit} className="modal-content">
      <ModalTitle>
        <YellowExclamationTriangleIcon className="co-icon-space-r" />
        {t('kubevirt-plugin~Delete {{modelLabel}}?', { modelLabel: VirtualMachineModel.label })}
      </ModalTitle>
      <ModalBody>
        <p>
          <Trans t={t} ns="kubevirt-plugin">
            Are you sure you want to delete <strong className="co-break-word">{{ name }}</strong> in
            namespace <strong>{{ namespace }}</strong>?
          </Trans>
        </p>
        {numOfAllResources > 0 && (
          <p>
            {t(
              'kubevirt-plugin~The following resources will be deleted along with this virtual machine. Unchecked items will not be deleted.',
            )}
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
              {t('kubevirt-plugin~Delete Disks ({{ownedVolumeResourcesLength}}x)', {
                ownedVolumeResourcesLength: ownedVolumeResources.length,
              })}
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
              {t('kubevirt-plugin~Delete {{vmImportModelLabel}} Resource', {
                vmImportModelLabel: VirtualMachineImportModel.label,
              })}
            </label>
          </div>
        )}
        {vmHasSnapshots && (
          <>
            <Trans t={t} ns="kubevirt-plugin">
              <strong>Warning: </strong>All snapshots of this virtual machine will be deleted as
              well.
            </Trans>
          </>
        )}
      </ModalBody>
      <VMIUsersAlert
        vmi={vmi}
        cancel={cancel}
        alertTitle={t('kubevirt-plugin~Delete Virtual Machine alert')}
      />
      <ModalSubmitFooter
        errorMessage={errorMessage}
        submitDisabled={isInProgress}
        inProgress={isInProgress}
        submitText={t('kubevirt-plugin~Delete')}
        submitDanger
        cancel={cancel}
      />
    </form>
  );
});

export type DeleteVMModalProps = {
  vm: VMKind;
  vmi?: VMIKind;
} & ModalComponentProps &
  HandlePromiseProps;

export const deleteVMModal = createModalLauncher(DeleteVMModal);
