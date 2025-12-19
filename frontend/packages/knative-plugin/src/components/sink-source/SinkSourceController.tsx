import type { FC } from 'react';
import { useCallback } from 'react';
import { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { ModalComponentProps, ModalWrapper } from '@console/internal/components/factory';
import { K8sResourceKind } from '@console/internal/module/k8s';
import SinkSource from './SinkSource';

type SinkSourceControllerProps = {
  source: K8sResourceKind;
};

const SinkSourceController: FC<SinkSourceControllerProps> = ({ source, ...props }) => (
  <SinkSource {...props} source={source} />
);

type Props = SinkSourceControllerProps & ModalComponentProps;

const SinkSourceModalProvider: OverlayComponent<Props> = (props) => {
  return (
    <ModalWrapper blocking onClose={props.closeOverlay}>
      <SinkSourceController cancel={props.closeOverlay} close={props.closeOverlay} {...props} />
    </ModalWrapper>
  );
};

export const useSinkSourceModalLauncher = (props: Props) => {
  const launcher = useOverlay();
  return useCallback(() => launcher<Props>(SinkSourceModalProvider, props), [
    launcher,
    props,
  ]);
};
