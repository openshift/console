import * as React from 'react';
import { Edge, EdgeConnectorArrow } from '@console/topology';
import { BaseEdge } from './BaseEdge';
import './TrafficConnector.scss';

type TrafficConnectorProps = {
  element: Edge;
};

const TrafficConnector: React.FC<TrafficConnectorProps> = ({ element }) => (
  <BaseEdge element={element} className="odc-traffic-connector">
    <EdgeConnectorArrow edge={element} />
  </BaseEdge>
);

export { TrafficConnector };
