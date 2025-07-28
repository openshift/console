import * as React from 'react';
import { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { ModalComponentProps, ModalWrapper } from '@console/internal/components/factory';
import { K8sResourceKind } from '@console/internal/module/k8s';
import PubSub from './PubSub';

type PubSubControllerProps = {
  source: K8sResourceKind;
  target?: K8sResourceKind;
};

const PubSubController: React.FC<PubSubControllerProps> = ({ source, ...props }) => (
  <PubSub {...props} source={source} />
);

type Props = PubSubControllerProps & ModalComponentProps;

const PubSubModalProvider: OverlayComponent<Props> = (props) => {
  return (
    <ModalWrapper blocking onClose={props.closeOverlay}>
      <PubSubController cancel={props.closeOverlay} close={props.closeOverlay} {...props} />
    </ModalWrapper>
  );
};

export const usePubSubModalLauncher = (props) => {
  const launcher = useOverlay();
  return React.useCallback(() => launcher<Props>(PubSubModalProvider, props), [launcher, props]);
};
