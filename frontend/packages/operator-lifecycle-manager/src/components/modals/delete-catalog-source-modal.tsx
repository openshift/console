import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  ModalComponentProps,
} from '@console/internal/components/factory/modal';
import { withHandlePromise, HandlePromiseProps } from '@console/internal/components/utils';
import { k8sKill, K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { YellowExclamationTriangleIcon } from '@console/shared';

const DeleteCatalogSourceModal: React.FC<DeleteCatalogSourceModalProps> = ({
  kind,
  resource,
  close,
  cancel,
  inProgress,
  errorMessage,
  handlePromise,
}) => {
  const { t } = useTranslation();
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
        <YellowExclamationTriangleIcon className="co-icon-space-r" />{' '}
        {t('olm~Delete CatalogSource?')}
      </ModalTitle>
      <ModalBody>
        <p>
          {t(
            'olm~By deleting a CatalogSource, any Operator that has been installed from this source will no longer receive updates.',
          )}
        </p>
        <p>
          <Trans ns="olm">
            Confirm deletion by typing{' '}
            <strong className="co-break-word">{{ name: resource.metadata.name }}</strong> below:
          </Trans>
        </p>
        <input
          type="text"
          className="pf-c-form-control"
          onKeyUp={isConfirmed}
          placeholder={t('olm~Enter name')}
          data-test="delete-catalogsource-input"
        />
      </ModalBody>
      <ModalSubmitFooter
        submitText={t('public~Delete')}
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
