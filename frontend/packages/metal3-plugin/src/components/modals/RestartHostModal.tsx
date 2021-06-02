import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory';
import { withHandlePromise } from '@console/internal/components/utils';
import { restartHost } from '../../k8s/requests/bare-metal-host';
import { BareMetalHostKind } from '../../types';
import { PowerOffWarning } from './PowerOffHostModal';

export type RestartHostModalProps = {
  host: BareMetalHostKind;
  handlePromise: <T>(promise: Promise<T>) => Promise<T>;
  inProgress: boolean;
  errorMessage: string;
  cancel?: () => void;
  close?: () => void;
};

const RestartHostModal = ({
  host,
  inProgress,
  errorMessage,
  handlePromise,
  close = undefined,
  cancel = undefined,
}: RestartHostModalProps) => {
  const { t } = useTranslation();
  const onSubmit = React.useCallback(
    async (event) => {
      event.preventDefault();
      const promise = restartHost(host);
      await handlePromise(promise);
      return close();
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

export const restartHostModal = createModalLauncher(withHandlePromise(RestartHostModal));
