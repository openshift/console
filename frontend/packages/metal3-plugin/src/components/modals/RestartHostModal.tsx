import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { getName } from '@console/shared';
import { withHandlePromise } from '@console/internal/components/utils';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory';
import { BareMetalHostKind } from '../../types';
import { restartHost } from '../../k8s/requests/bare-metal-host';

export type RestartHostModalProps = {
  host: BareMetalHostKind;
  nodeName: string;
  handlePromise: <T>(promise: Promise<T>) => Promise<T>;
  inProgress: boolean;
  errorMessage: string;
  cancel?: () => void;
  close?: () => void;
};

const RestartHostModal = ({
  host,
  nodeName,
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

  const text = nodeName
    ? t(
        'metal3-plugin~The bare metal host {{name}} will be restarted gracefully after all managed workloads are moved.',
        { name: getName(host) },
      )
    : t('metal3-plugin~The bare metal host {{name}} will be restarted gracefully.', {
        name: getName(host),
      });

  return (
    <form onSubmit={onSubmit} name="form" className="modal-content">
      <ModalTitle>{t('metal3-plugin~Restart Bare Metal Host')}</ModalTitle>
      <ModalBody>{text}</ModalBody>
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
