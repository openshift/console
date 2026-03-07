import type { FC } from 'react';
import { useCallback, useEffect } from 'react';
import { Modal } from '@patternfly/react-core';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import type { ModalComponentProps } from '@console/internal/components/factory/modal';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import PubSub from './PubSub';
import { setPubSubModalLauncher } from './PubSubModalLauncher';

type PubSubControllerProps = {
  source: K8sResourceKind;
  target?: K8sResourceKind;
  onOverlayClose?: () => void;
};

const PubSubController: FC<PubSubControllerProps> = ({ source, ...props }) => (
  <PubSub {...props} source={source} />
);

type Props = PubSubControllerProps & ModalComponentProps;

export const PubSubModalOverlay: OverlayComponent<Props> = (props) => {
  const handleOverlayDismiss = useCallback(() => {
    // When dismissed via overlay (ESC, click outside), call onOverlayClose
    // This allows promise settlement tracking in addPubSubConnectionModal
    if (props.onOverlayClose) {
      props.onOverlayClose();
    }
    props.closeOverlay();
  }, [props]);

  return (
    <Modal isOpen onClose={handleOverlayDismiss} variant="small">
      <PubSubController
        cancel={props.cancel || props.closeOverlay}
        close={props.close || props.closeOverlay}
        {...props}
      />
    </Modal>
  );
};

export const usePubSubModalLauncher = (props) => {
  const launchModal = useOverlay();
  return useCallback(() => launchModal<Props>(PubSubModalOverlay, props), [launchModal, props]);
};

/**
 * Zero-render component that syncs the overlay launcher for non-React contexts.
 * Must be rendered inside OverlayProvider (typically in Topology component).
 */
export const SyncPubSubModalLauncher: FC = () => {
  const launchModal = useOverlay();

  useEffect(() => {
    setPubSubModalLauncher(launchModal);
    return () => setPubSubModalLauncher(null);
  }, [launchModal]);

  return null;
};
