import * as React from 'react';
import {
  WithSourceDragProps,
  WithTargetDragProps,
  WithRemoveConnectorProps,
  Edge,
  observer,
  EdgeConnectorArrow,
} from '@console/topology';
import BaseEdge from './BaseEdge';
import './ServiceBinding.scss';

type ServiceBindingProps = {
  element: Edge;
  dragging?: boolean;
} & WithSourceDragProps &
  WithTargetDragProps &
  WithRemoveConnectorProps;

const ServiceBinding: React.FC<ServiceBindingProps> = ({
  element,
  targetDragRef,
  children,
  ...others
}) => (
  <BaseEdge element={element} {...others} className="odc2-service-binding">
    <EdgeConnectorArrow dragRef={targetDragRef} edge={element} />
    {children}
  </BaseEdge>
);

export default observer(ServiceBinding);
