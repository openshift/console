import * as React from 'react';
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
import { TemplateModel } from '@console/internal/models';
import { apiVersionForModel, TemplateKind } from '@console/internal/module/k8s';
import { asVM, getVolumes } from '../../../selectors/vm';
import { useOwnedVolumeReferencedResources } from '../../../hooks/use-owned-volume-referenced-resources';
import { useUpToDateVMLikeEntity } from '../../../hooks/use-vm-like-entity';
import { deleteVMTemplate } from '../../../k8s/requests/vmtemplate/actions';
import { redirectToList } from './utils';

export const DeleteVMTemplateModal = withHandlePromise((props: DeleteVMTemplateModalProps) => {
  const { inProgress, errorMessage, handlePromise, close, cancel, vmTemplate } = props;
  const vmTemplateUpToDate = useUpToDateVMLikeEntity<TemplateKind>(vmTemplate);
  const [deleteDisks, setDeleteDisks] = React.useState<boolean>(true);

  const namespace = getNamespace(vmTemplateUpToDate);
  const name = getName(vmTemplateUpToDate);

  const vmTemplateReference = {
    name,
    kind: TemplateModel.kind,
    apiVersion: apiVersionForModel(TemplateModel),
  } as any;

  const [ownedVolumeResources, isOwnedVolumeResourcesLoaded] = useOwnedVolumeReferencedResources(
    vmTemplateReference,
    namespace,
    getVolumes(asVM(vmTemplateUpToDate), null),
  );
  const isInProgress = inProgress || !isOwnedVolumeResourcesLoaded;
  const numOfAllResources = ownedVolumeResources.length;

  const submit = (e) => {
    e.preventDefault();

    const promise = deleteVMTemplate(vmTemplateUpToDate, {
      ownedVolumeResources,
      deleteOwnedVolumeResources: deleteDisks,
    });

    return handlePromise(promise, () => {
      close();
      redirectToList(vmTemplateUpToDate, 'templates');
    });
  };

  return (
    <form onSubmit={submit} className="modal-content">
      <ModalTitle>
        <YellowExclamationTriangleIcon className="co-icon-space-r" /> Delete Virtual Machine
        Template?
      </ModalTitle>
      <ModalBody>
        Are you sure you want to delete <strong className="co-break-word">{name}</strong> in
        namespace <strong>{namespace}</strong>?
        {numOfAllResources > 0 && (
          <p>
            The following resources will be deleted along with this virtual machine template.
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

export type DeleteVMTemplateModalProps = {
  vmTemplate: TemplateKind;
} & ModalComponentProps &
  HandlePromiseProps;

export const deleteVMTemplateModal = createModalLauncher(DeleteVMTemplateModal);
