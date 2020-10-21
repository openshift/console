import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useDispatch } from 'react-redux';
import { k8sKill, K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  ModalComponentProps,
} from '@console/internal/components/factory/modal';
import { history } from '@console/internal/components/utils';
import { setActiveNamespace } from '@console/internal/actions/ui';
import { ALL_NAMESPACES_KEY, YellowExclamationTriangleIcon } from '@console/shared';
import { useActiveNamespace } from '@console/shared/src/hooks/redux-selectors';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';

export const DeleteNamespaceModal: React.FC<DeleteNamespaceModalProps> = ({
  cancel,
  close,
  kind,
  resource,
}) => {
  const activeNamespace = useActiveNamespace();
  const dispatch = useDispatch();
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();
  const [confirmed, setConfirmed] = React.useState(false);

  const onSubmit = (event) => {
    event.preventDefault();
    handlePromise(k8sKill(kind, resource))
      .then(() => {
        if (resource.metadata.name === activeNamespace) {
          dispatch(setActiveNamespace(ALL_NAMESPACES_KEY));
        }
        close?.();
        history.push(`/k8s/cluster/${kind.plural}`);
      })
      .catch(() => {
        /* do nothing */
      });
  };

  const onKeyUp = (e) => {
    setConfirmed(e.currentTarget.value === resource.metadata.name);
  };

  return (
    <form onSubmit={onSubmit} name="form" className="modal-content ">
      <ModalTitle className="modal-header">
        <YellowExclamationTriangleIcon className="co-icon-space-r" /> Delete {kind.label}?
      </ModalTitle>
      <ModalBody>
        <p>
          This action cannot be undone. It will destroy all pods, services and other objects in the
          namespace <strong className="co-break-word">{resource.metadata.name}</strong>.
        </p>
        <p>
          Confirm deletion by typing{' '}
          <strong className="co-break-word">{resource.metadata.name}</strong> below:
        </p>
        <input
          type="text"
          data-test="project-name-input"
          className="pf-c-form-control"
          onKeyUp={onKeyUp}
          placeholder="Enter name"
          aria-label={`Enter the name of the ${kind.label} to delete`}
          autoFocus={true}
        />
      </ModalBody>
      <ModalSubmitFooter
        submitText="Delete"
        submitDisabled={!confirmed}
        cancel={() => cancel?.()}
        errorMessage={errorMessage}
        inProgress={inProgress}
        submitDanger
      />
    </form>
  );
};

export const deleteNamespaceModal = createModalLauncher(DeleteNamespaceModal);

type DeleteNamespaceModalProps = {
  resource: K8sResourceKind;
  kind: K8sKind;
} & ModalComponentProps;
