import type { FormEvent } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Button, Form, Modal, ModalBody, ModalHeader, ModalVariant } from '@patternfly/react-core';
import { k8sPatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { K8sModel, OAuthKind } from '@console/internal/module/k8s';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';

const RemoveIdentityProviderModalContent: OverlayComponent<RemoveIdentityProvider> = ({
  obj,
  model,
  index,
  name,
  type,
  closeOverlay,
}) => {
  const { t } = useTranslation();
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    handlePromise(
      k8sPatchResource({
        model,
        resource: obj,
        data: [
          {
            op: 'remove',
            path: `/spec/identityProviders/${index}`,
          },
        ],
      }),
    ).then(() => closeOverlay());
  };

  return (
    <>
      <ModalBody>
        <Form onSubmit={handleSubmit} id="remove-idp-form" />
        <Trans ns="public">
          Are you sure you want to remove <strong>{{ name }}</strong> identity provider from OAuth{' '}
          <strong>{{ type }}</strong>?
        </Trans>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={errorMessage}>
        <Button
          type="submit"
          variant="danger"
          isDisabled={inProgress}
          isLoading={inProgress}
          form="remove-idp-form"
          data-test="confirm-action"
          id="confirm-action"
        >
          {t('public~Remove')}
        </Button>
        <Button
          type="button"
          variant="link"
          isDisabled={inProgress}
          onClick={closeOverlay}
          data-test-id="modal-cancel-action"
        >
          {t('public~Cancel')}
        </Button>
      </ModalFooterWithAlerts>
    </>
  );
};

export const RemoveIdentityProviderModal: OverlayComponent<RemoveIdentityProvider> = (props) => {
  const { t } = useTranslation();
  return (
    <Modal variant={ModalVariant.small} isOpen onClose={props.closeOverlay}>
      <ModalHeader
        titleIconVariant="warning"
        title={t('public~Remove identity provider from OAuth?')}
      />
      <RemoveIdentityProviderModalContent {...props} />
    </Modal>
  );
};

export type RemoveIdentityProvider = {
  obj: OAuthKind;
  model: K8sModel;
  index: number;
  name: string;
  type: string;
};
