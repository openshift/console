import * as React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { k8sPatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import {
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
  ModalWrapper,
} from '@console/internal/components/factory/modal';
import { ModalComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/ModalProvider';
import { K8sModel, OAuthKind } from '@console/internal/module/k8s';
import { YellowExclamationTriangleIcon } from '@console/shared/src/components/status/icons';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';

const RemoveIdentityProviderModalComponent = ({
  obj,
  model,
  index,
  name,
  type,
  cancel,
  close,
}: RemoveIdentityProviderModalProps) => {
  const { t } = useTranslation();
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
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
    ).then(() => close());
  };

  return (
    <form onSubmit={handleSubmit} name="form" className="modal-content ">
      <ModalTitle>
        <YellowExclamationTriangleIcon className="co-icon-space-r" />
        {t('public~Remove identity provider from OAuth?')}
      </ModalTitle>
      <ModalBody>
        <ModalBody>
          <Trans ns="public">
            Are you sure you want to remove <strong> {{ name }}</strong> identity provider from
            OAuth
            <strong> {{ type }}</strong>?
          </Trans>
        </ModalBody>
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMessage}
        inProgress={inProgress}
        submitText={t('public~Remove')}
        cancel={cancel}
        submitDanger
      />
    </form>
  );
};

export const RemoveIdentityProviderModal: ModalComponent<RemoveIdentityProviderModalProps> = ({
  closeModal,
  obj,
  model,
  index,
  name,
  type,
}) => {
  return (
    <ModalWrapper blocking onClose={closeModal}>
      <RemoveIdentityProviderModalComponent
        close={closeModal}
        cancel={closeModal}
        obj={obj}
        model={model}
        index={index}
        name={name}
        type={type}
      />
    </ModalWrapper>
  );
};

export type RemoveIdentityProvider = {
  obj: OAuthKind;
  model: K8sModel;
  index: number;
  name: string;
  type: string;
};

type RemoveIdentityProviderModalProps = RemoveIdentityProvider & ModalComponentProps;
