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
import './ConnectsTo.scss';

type ConnectsToProps = {
  element: Edge;
  dragging?: boolean;
} & WithSourceDragProps &
  WithTargetDragProps &
  WithRemoveConnectorProps;

const ConnectsTo: React.FC<ConnectsToProps> = ({ element, targetDragRef, children, ...others }) => (
  <BaseEdge className="odc2-connects-to" element={element} {...others}>
    <EdgeConnectorArrow dragRef={targetDragRef} edge={element} />
    {children}
  </BaseEdge>
);

export default observer(ConnectsTo);
