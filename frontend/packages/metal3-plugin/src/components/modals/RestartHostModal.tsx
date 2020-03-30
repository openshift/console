import * as React from 'react';
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
      <ModalTitle>Restart host {getName(host)}</ModalTitle>
      <ModalBody>
        The bare metal host will be scheduled for restart which will be executed once all managed
        workloads are moved to nodes on other hosts.
      </ModalBody>
      <ModalSubmitFooter
        cancel={cancel}
        errorMessage={errorMessage}
        inProgress={inProgress}
        submitDisabled={false}
        submitText="Restart"
      />
    </form>
  );
};

export const restartHostModal = createModalLauncher(withHandlePromise(RestartHostModal));
