import * as React from 'react';
import {
  WithSourceDragProps,
  WithTargetDragProps,
  Edge,
  observer,
  EdgeConnectorArrow,
  WithContextMenuProps,
} from '@patternfly/react-topology';
import { BaseEdge } from './BaseEdge';

import './ServiceBinding.scss';

type ServiceBindingProps = {
  element: Edge;
  dragging?: boolean;
} & WithSourceDragProps &
  WithTargetDragProps &
  WithContextMenuProps;

const ObservedServiceBinding: React.FC<ServiceBindingProps> = ({
  element,
  targetDragRef,
  children,
  ...others
}) => (
  <BaseEdge element={element} {...others} className="odc-service-binding">
    <EdgeConnectorArrow dragRef={targetDragRef} edge={element} />
    {children}
  </BaseEdge>
);

const ServiceBinding = observer(ObservedServiceBinding);
export { ServiceBinding };
