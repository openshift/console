import type { FC } from 'react';
import { useCallback } from 'react';
import { Modal } from '@patternfly/react-core';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import type { ModalComponentProps } from '@console/internal/components/factory';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import SinkPubsub from './SinkPubsub';

type SinkPubsubControllerProps = {
  source: K8sResourceKind;
  resourceType: string;
};

const SinkPubsubController: FC<SinkPubsubControllerProps> = ({ source, ...props }) => (
  <SinkPubsub {...props} source={source} />
);

type Props = SinkPubsubControllerProps & ModalComponentProps;

const SinkPubsubModalProvider: OverlayComponent<Props> = (props) => (
  <Modal isOpen onClose={props.closeOverlay} variant="small">
    <SinkPubsubController cancel={props.closeOverlay} close={props.closeOverlay} {...props} />
  </Modal>
);

export const useSinkPubsubModalLauncher = (props: Props) => {
  const launcher = useOverlay();
  return useCallback(() => launcher<Props>(SinkPubsubModalProvider, props), [launcher, props]);
};
