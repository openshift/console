import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';
import { restartHost } from '../../k8s/requests/bare-metal-host';
import { BareMetalHostKind } from '../../types';
import { PowerOffWarning } from './PowerOffHostModal';

export type RestartHostModalProps = {
  host: BareMetalHostKind;
  cancel?: () => void;
  close?: () => void;
};

const RestartHostModal: React.FC<RestartHostModalProps> = ({
  host,
  close = undefined,
  cancel = undefined,
}) => {
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();
  const { t } = useTranslation();
  const onSubmit = React.useCallback(
    (event) => {
      event.preventDefault();
      const promise = restartHost(host);
      return handlePromise(promise).then(() => {
        close();
      });
    },
    [host, close, handlePromise],
  );

  return (
    <form onSubmit={onSubmit} name="form" className="modal-content">
      <ModalTitle>{t('metal3-plugin~Restart Bare Metal Host')}</ModalTitle>
      <ModalBody>
        <p>{t('metal3-plugin~The host will be powered off and on again.')}</p>
        <PowerOffWarning restart />
      </ModalBody>
      <ModalSubmitFooter
        cancel={cancel}
        errorMessage={errorMessage}
        inProgress={inProgress}
        submitDisabled={false}
        submitText={t('metal3-plugin~Restart')}
      />
    </form>
  );
};

export const restartHostModal = createModalLauncher(RestartHostModal);
