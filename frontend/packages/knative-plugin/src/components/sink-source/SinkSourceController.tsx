import * as React from 'react';
import { createModalLauncher, ModalComponentProps } from '@console/internal/components/factory';
import { K8sResourceKind } from '@console/internal/module/k8s';
import SinkSource from './SinkSource';

type SinkSourceControllerProps = {
  source: K8sResourceKind;
};

const SinkSourceController: React.FC<SinkSourceControllerProps> = ({ source, ...props }) => (
  <SinkSource {...props} source={source} />
);

type Props = SinkSourceControllerProps & ModalComponentProps;

export const sinkModalLauncher = createModalLauncher<Props>(SinkSourceController);

export default SinkSourceController;
