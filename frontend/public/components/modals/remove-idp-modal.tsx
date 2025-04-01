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
import { HandlePromiseProps, withHandlePromise } from '@console/internal/components/utils';
import { K8sModel, OAuthKind } from '@console/internal/module/k8s';
import { YellowExclamationTriangleIcon } from '@console/shared';

const RemoveIdentityProviderModalComponent = withHandlePromise(
  ({
    obj,
    model,
    index,
    name,
    type,
    inProgress,
    errorMessage,
    cancel,
    close,
    handlePromise,
  }: RemoveIdentityProviderModalProps) => {
    const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
      e.preventDefault();

      return handlePromise(
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
        close,
      );
    };

    const { t } = useTranslation();
    return (
      <form onSubmit={handleSubmit} name="form" className="modal-content ">
        <ModalTitle>
          <YellowExclamationTriangleIcon className="co-icon-space-r" />
          {t('public~Remove identity provider from QAuth?')}
        </ModalTitle>
        <ModalBody>
          <ModalBody>
            <Trans ns="public">
              Are you sure you want to remove <strong> {{ name }}</strong> identity provider from
              QAuth<strong> {{ type }}</strong>?
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
  },
);

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

type RemoveIdentityProviderModalProps = RemoveIdentityProvider &
  ModalComponentProps &
  HandlePromiseProps;
