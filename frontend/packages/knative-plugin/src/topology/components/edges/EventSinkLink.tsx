import * as React from 'react';
import { Edge, observer } from '@patternfly/react-topology';
import { BaseEdge } from '@console/topology/src/components/graph-view';
import { EVENT_MARKER_RADIUS } from '../../const';
import './EventSourceLink.scss';

type EventSinkLinkProps = {
  element: Edge;
};

const EventSinkLink: React.FC<EventSinkLinkProps> = ({ element, ...others }) => {
  const markerPoint = element.getEndPoint();

  return (
    <BaseEdge className="odc-event-source-link" element={element} {...others}>
      <circle
        className="topology-connector-arrow"
        cx={markerPoint.x}
        cy={markerPoint.y}
        r={EVENT_MARKER_RADIUS}
      />
    </BaseEdge>
  );
};

export default observer(EventSinkLink);
