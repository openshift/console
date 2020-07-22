import * as React from 'react';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { createModalLauncher, ModalComponentProps } from '@console/internal/components/factory';
import PubSub from './PubSub';

type PubSubControllerProps = {
  source: K8sResourceKind;
  target?: K8sResourceKind;
};

const PubSubController: React.FC<PubSubControllerProps> = ({ source, ...props }) => (
  <PubSub {...props} source={source} />
);

type Props = PubSubControllerProps & ModalComponentProps;

export const PubSubModalLauncher = createModalLauncher<Props>(PubSubController);

export default PubSubController;
