import * as React from 'react';
import {
  WithSourceDragProps,
  WithTargetDragProps,
  WithRemoveConnectorProps,
  Edge,
  observer,
  EdgeConnectorArrow,
} from '@console/topology';
import { BaseEdge } from './BaseEdge';
import './ServiceBinding.scss';

type ServiceBindingProps = {
  element: Edge;
  dragging?: boolean;
} & WithSourceDragProps &
  WithTargetDragProps &
  WithRemoveConnectorProps;

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
