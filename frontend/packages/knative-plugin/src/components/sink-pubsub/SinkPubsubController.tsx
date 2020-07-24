import * as React from 'react';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { createModalLauncher, ModalComponentProps } from '@console/internal/components/factory';
import SinkPubsub from './SinkPubsub';

type SinkPubsubControllerProps = {
  source: K8sResourceKind;
};

const SinkPubsubController: React.FC<SinkPubsubControllerProps> = ({ source, ...props }) => (
  <SinkPubsub {...props} source={source} />
);

type Props = SinkPubsubControllerProps & ModalComponentProps;

export const sinkPubsubModalLauncher = createModalLauncher<Props>(SinkPubsubController);

export default SinkPubsubController;
