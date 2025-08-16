import * as React from 'react';
import { Button, Modal, ModalVariant, ModalFooter } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { restartHost } from '../../k8s/requests/bare-metal-host';
import { BareMetalHostKind } from '../../types';
import { PowerOffWarning } from './PowerOffHostModal';

export type RestartHostModalProps = {
  host: BareMetalHostKind;
  closeOverlay: () => void;
};

const RestartHostModal: React.FC<RestartHostModalProps> = ({ host, closeOverlay }) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (): Promise<void> => {
    setIsSubmitting(true);
    try {
      await restartHost(host);
      closeOverlay();
    } catch (error) {
      // Error handling - could be logged to monitoring system in production
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      variant={ModalVariant.small}
      title={t('metal3-plugin~Restart Bare Metal Host')}
      isOpen
      onClose={closeOverlay}
    >
      {t('metal3-plugin~The host will be powered off and on again.')}
      <PowerOffWarning restart />
      <ModalFooter>
        <Button
          variant="primary"
          onClick={handleSubmit}
          isLoading={isSubmitting}
          isDisabled={isSubmitting}
        >
          {t('metal3-plugin~Restart')}
        </Button>
        <Button variant="secondary" onClick={closeOverlay}>
          {t('console-app~Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export const useRestartHostModal = () => {
  const launchOverlay = useOverlay();
  return (props: Omit<RestartHostModalProps, 'closeOverlay'>) => {
    launchOverlay(RestartHostModal, props);
  };
};
