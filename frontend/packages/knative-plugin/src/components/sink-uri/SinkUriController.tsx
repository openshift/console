import * as React from 'react';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { createModalLauncher, ModalComponentProps } from '@console/internal/components/factory';
import SinkUri from './SinkUri';

type SinkUriControllerProps = {
  source: K8sResourceKind;
  eventSourceList: K8sResourceKind[];
};

const SinkUriController: React.FC<SinkUriControllerProps> = ({
  source,
  eventSourceList,
  ...props
}) => <SinkUri {...props} source={source} eventSourceList={eventSourceList} />;

type Props = SinkUriControllerProps & ModalComponentProps;

export const sinkModalLauncher = createModalLauncher<Props>(SinkUriController);

export default SinkUriController;
