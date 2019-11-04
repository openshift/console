import * as React from 'react';
import { Edge, observer } from '@console/topology';
import BaseEdge from './BaseEdge';
import './EventSourceLink.scss';

type ConnectsToProps = {
  element: Edge;
};

const ConnectsTo: React.FC<ConnectsToProps> = ({ element }) => {
  const markerPoint = element.getEndPoint();
  return (
    <BaseEdge className="odc-event-source-link" element={element}>
      <circle cx={markerPoint.x} cy={markerPoint.y} r={6} />
    </BaseEdge>
  );
};

export default observer(ConnectsTo);
