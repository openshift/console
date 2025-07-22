import { useCallback } from 'react';
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

const RestartHostModal = ({
  host,
  close = undefined,
  cancel = undefined,
}: RestartHostModalProps) => {
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();
  const { t } = useTranslation();
  const onSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const promise = restartHost(host);
      handlePromise(promise)
        .then(() => {
          close();
        })
        .catch(() => {});
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
