import { useCallback } from 'react';
import { Modal, ModalHeader, ModalVariant, ModalBody, Button } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/lib-core';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/lib-core';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';
import { usePromiseHandler } from '@console/shared/src/hooks/usePromiseHandler';
import type { ModalComponentProps } from '@console/shared/src/types/modal';
import { restartHost } from '../../k8s/requests/bare-metal-host';
import type { BareMetalHostKind } from '../../types/host';
import { PowerOffWarning } from './PowerOffHostModal';

export type RestartHostModalProps = {
  host: BareMetalHostKind;
} & ModalComponentProps;

const RestartHostModal: OverlayComponent<RestartHostModalProps> = (props) => {
  const { t } = useTranslation('metal3-plugin');
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
    <Modal
      isOpen
      onClose={props.closeOverlay}
      variant={ModalVariant.small}
      aria-labelledby="restart-host-modal-title"
    >
      <ModalHeader
        title={t('Restart Bare Metal Host')}
        data-test-id="modal-title"
        labelId="restart-host-modal-title"
      />
      <ModalBody>
        <p>{t('The host will be powered off and on again.')}</p>
        <PowerOffWarning restart />
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={errorMessage}>
        <Button
          variant="primary"
          onClick={onSubmit}
          isLoading={inProgress}
          data-test="confirm-action"
          id="confirm-action"
        >
          {t('Restart')}
        </Button>
        <Button variant="link" onClick={closeOverlay} data-test-id="modal-cancel-action">
          {t('Cancel')}
        </Button>
      </ModalFooterWithAlerts>
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
