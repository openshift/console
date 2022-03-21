import * as React from 'react';
import {
  WithSourceDragProps,
  WithTargetDragProps,
  Edge,
  observer,
  WithContextMenuProps,
  EdgeTerminalType,
} from '@patternfly/react-topology';
import BaseEdge from './BaseEdge';

import './ServiceBinding.scss';

type ServiceBindingProps = {
  element: Edge;
  dragging?: boolean;
} & WithSourceDragProps &
  WithTargetDragProps &
  WithContextMenuProps;

const ServiceBinding: React.FC<ServiceBindingProps> = (props) => (
  <BaseEdge
    className="odc-service-binding"
    endTerminalType={EdgeTerminalType.directionalAlt}
    {...props}
  />
);

export default observer(ServiceBinding);
