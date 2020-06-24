import * as React from 'react';
import { Edge, observer, EdgeConnectorArrow } from '@console/topology';
import { BaseEdge } from '@console/dev-console/src/components/topology';

import './TrafficLink.scss';

type TrafficLinkProps = {
  element: Edge;
};

const TrafficLink: React.FC<TrafficLinkProps> = ({ element }) => {
  const { percent } = element.getData();
  let text = null;
  if (percent != null) {
    const startPoint = element.getStartPoint();
    const endPoint = element.getEndPoint();
    text = (
      <text
        className="odc-traffic-link__text"
        x={(endPoint.x + startPoint.x) / 2}
        y={(endPoint.y + startPoint.y) / 2}
        textAnchor="middle"
      >
        {percent}%
      </text>
    );
  }
  return (
    <BaseEdge element={element} className="odc-traffic-link">
      <EdgeConnectorArrow edge={element} />
      {text}
    </BaseEdge>
  );
};

export default observer(TrafficLink);
