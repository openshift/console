import * as React from 'react';
import {
  Edge,
  EdgeTerminalType,
  NodeStatus,
  observer,
  WithSourceDragProps,
  WithTargetDragProps,
  WithContextMenuProps,
} from '@patternfly/react-topology';
import { ComputedServiceBindingStatus } from '@console/service-binding-plugin/src/types';
import { getComputedServiceBindingStatus } from '@console/service-binding-plugin/src/utils';
import BaseEdge from './BaseEdge';

import './ServiceBinding.scss';

type ServiceBindingProps = {
  element: Edge;
  dragging?: boolean;
} & WithSourceDragProps &
  WithTargetDragProps &
  WithContextMenuProps;

const ServiceBinding: React.FC<ServiceBindingProps> = (props) => {
  const { sbr } = props.element.getData();

  const hasError = getComputedServiceBindingStatus(sbr) === ComputedServiceBindingStatus.ERROR;

  return (
    <BaseEdge
      className="odc-service-binding"
      startTerminalStatus={hasError ? NodeStatus.danger : undefined}
      startTerminalType={hasError ? EdgeTerminalType.cross : undefined}
      endTerminalStatus={hasError ? NodeStatus.danger : undefined}
      endTerminalType={EdgeTerminalType.directional}
      {...props}
    />
  );
};

export default observer(ServiceBinding);
