import * as React from 'react';
import { k8sKill, K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  ModalComponentProps,
} from '@console/internal/components/factory/modal';
import { YellowExclamationTriangleIcon } from '@console/shared';
import { withHandlePromise, HandlePromiseProps } from '@console/internal/components/utils';

const DeleteCatalogSourceModal: React.FC<DeleteCatalogSourceModalProps> = ({
  kind,
  resource,
  close,
  cancel,
  inProgress,
  errorMessage,
  handlePromise,
}) => {
  const [confirmed, setConfirmed] = React.useState<boolean>(false);
  const isConfirmed = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setConfirmed(e.currentTarget.value === resource.metadata.name);
  };

  const submit = React.useCallback(
    (event: React.FormEvent<EventTarget>) => {
      event.preventDefault();
      return handlePromise(k8sKill(kind, resource), close);
    },
    [close, handlePromise, kind, resource],
  );

  return (
    <form onSubmit={submit} name="form" className="modal-content ">
      <ModalTitle>
        <YellowExclamationTriangleIcon className="co-icon-space-r" /> Delete {kind.label}?
      </ModalTitle>
      <ModalBody>
        <p>
          By deleting a catlog source, any operator that has been installed from this source will no
          longer receive updates.
        </p>
        <p>
          Confirm deletion by typing &nbsp;
          <strong className="co-break-word">{resource.metadata.name}</strong>
          &nbsp; below:
        </p>
        <input
          type="text"
          className="pf-c-form-control"
          onKeyUp={isConfirmed}
          placeholder="Enter name"
        />
      </ModalBody>
      <ModalSubmitFooter
        submitText="Delete"
        submitDisabled={!confirmed}
        cancel={cancel}
        errorMessage={errorMessage}
        inProgress={inProgress}
        submitDanger
      />
    </form>
  );
};

type DeleteCatalogSourceModalProps = {
  kind: K8sKind;
  resource: K8sResourceKind;
} & ModalComponentProps &
  HandlePromiseProps;

export const deleteCatalogSourceModal = createModalLauncher(
  withHandlePromise(DeleteCatalogSourceModal),
);
