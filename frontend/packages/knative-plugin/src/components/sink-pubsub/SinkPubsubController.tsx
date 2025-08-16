import * as React from 'react';
import { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { ModalComponentProps, ModalWrapper } from '@console/internal/components/factory';
import { K8sResourceKind } from '@console/internal/module/k8s';
import SinkPubsub from './SinkPubsub';

type SinkPubsubControllerProps = {
  source: K8sResourceKind;
  resourceType: string;
};

const SinkPubsubController: React.FC<SinkPubsubControllerProps> = ({ source, ...props }) => (
  <SinkPubsub {...props} source={source} />
);

type Props = SinkPubsubControllerProps & ModalComponentProps;

const SinkPubsubModalProvider: OverlayComponent<Props> = (props) => {
  return (
    <ModalWrapper blocking onClose={props.closeOverlay}>
      <SinkPubsubController cancel={props.closeOverlay} close={props.closeOverlay} {...props} />
    </ModalWrapper>
  );
};

export const useSinkPubsubModalLauncher = (props: Props) => {
  const launcher = useOverlay();
  return React.useCallback(() => launcher<Props>(SinkPubsubModalProvider, props), [
    launcher,
    props,
  ]);
};
