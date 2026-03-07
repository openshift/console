import { useCallback } from 'react';
import {
  Modal,
  ModalHeader,
  ModalVariant,
  ModalBody as PfModalBody,
  ModalFooter as PfModalFooter,
  Button,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/lib-core';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/lib-core';
import type { ModalComponentProps } from '@console/internal/components/factory';
import { ErrorMessage } from '@console/internal/components/utils';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';
import { restartHost } from '../../k8s/requests/bare-metal-host';
import type { BareMetalHostKind } from '../../types';
import { PowerOffWarning } from './PowerOffHostModal';

export type RestartHostModalProps1 = {
  host: BareMetalHostKind;
  cancel?: () => void;
  close?: () => void;
};

export type RestartHostModalProps = {
  host: BareMetalHostKind;
} & ModalComponentProps;

const RestartHostModal: OverlayComponent<RestartHostModalProps> = (props) => {
  const { t } = useTranslation();
  const { host, closeOverlay } = props;
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();
  const onSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const promise = restartHost(host);
      handlePromise(promise)
        .then(() => {
          closeOverlay();
        })
        .catch(() => {});
    },
    [host, closeOverlay, handlePromise],
  );

  return (
    <Modal isOpen onClose={props.closeOverlay} variant={ModalVariant.small}>
      <ModalHeader title={t('metal3-plugin~Restart Bare Metal Host')} />
      <PfModalBody>
        <p>{t('metal3-plugin~The host will be powered off and on again.')}</p>
        <PowerOffWarning restart />
      </PfModalBody>
      <PfModalFooter>
        {errorMessage && <ErrorMessage message={errorMessage} />}
        <Button variant="primary" onClick={onSubmit} isLoading={inProgress}>
          {t('metal3-plugin~Restart')}
        </Button>
        <Button variant="link" onClick={closeOverlay}>
          {t('metal3-plugin~Cancel')}
        </Button>
      </PfModalFooter>
    </Modal>
  );
};

export const useRestartHostModalLauncher = (props: RestartHostModalProps) => {
  const launcher = useOverlay();
  return useCallback(() => launcher<RestartHostModalProps>(RestartHostModal, props), [
    launcher,
    props,
  ]);
};
