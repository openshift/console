import type { FC } from 'react';
import { useCallback } from 'react';
import { Modal } from '@patternfly/react-core';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import type { ModalComponentProps } from '@console/internal/components/factory';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import SinkUri from './SinkUri';

type SinkUriControllerProps = {
  source: K8sResourceKind;
  eventSourceList: K8sResourceKind[];
};

const SinkUriController: FC<SinkUriControllerProps> = ({ source, eventSourceList, ...props }) => (
  <SinkUri {...props} source={source} eventSourceList={eventSourceList} />
);

type Props = SinkUriControllerProps & ModalComponentProps;

const SinkUriModalProvider: OverlayComponent<Props> = (props) => {
  return (
    <Modal isOpen onClose={props.closeOverlay} variant="small">
      <SinkUriController cancel={props.closeOverlay} close={props.closeOverlay} {...props} />
    </Modal>
  );
};

export const useSinkUriModalLauncher = (props: Props) => {
  const launcher = useOverlay();
  return useCallback(() => launcher<Props>(SinkUriModalProvider, props), [launcher, props]);
};
