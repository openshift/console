import type { FC } from 'react';
import { useCallback } from 'react';
import { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { ModalComponentProps, ModalWrapper } from '@console/internal/components/factory';
import { K8sResourceKind } from '@console/internal/module/k8s';
import SinkUri from './SinkUri';

type SinkUriControllerProps = {
  source: K8sResourceKind;
  eventSourceList: K8sResourceKind[];
};

const SinkUriController: FC<SinkUriControllerProps> = ({
  source,
  eventSourceList,
  ...props
}) => <SinkUri {...props} source={source} eventSourceList={eventSourceList} />;

type Props = SinkUriControllerProps & ModalComponentProps;

const SinkUriModalProvider: OverlayComponent<Props> = (props) => {
  return (
    <ModalWrapper blocking onClose={props.closeOverlay}>
      <SinkUriController cancel={props.closeOverlay} close={props.closeOverlay} {...props} />
    </ModalWrapper>
  );
};

export const useSinkUriModalLauncher = (props: Props) => {
  const launcher = useOverlay();
  return useCallback(() => launcher<Props>(SinkUriModalProvider, props), [launcher, props]);
};
