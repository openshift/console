import * as React from 'react';
import Point from '../geom/Point';
import ConnectorArrow from './ConnectorArrow';

import './DefaultCreateConnector.scss';

type DefaultCreateConnectorProps = {
  startPoint: Point;
  endPoint: Point;
  hints?: string[];
};

const DefaultCreateConnector: React.FC<DefaultCreateConnectorProps> = ({
  startPoint,
  endPoint,
  hints,
}) => (
  <g className="topology-default-create-connector">
    <line
      className="topology-default-create-connector__line"
      x1={startPoint.x}
      y1={startPoint.y}
      x2={endPoint.x}
      y2={endPoint.y}
    />
    {hints && hints.length === 1 && hints[0] === 'create' ? (
      <g
        transform={`translate(${endPoint.x},${endPoint.y})`}
        className="topology-default-create-connector__create"
      >
        <circle cx={0} cy={0} r={6} />
        <path d="M0,-3 V3 M-3,0 H3" />
      </g>
    ) : (
      <ConnectorArrow startPoint={startPoint} endPoint={endPoint} />
    )}
  </g>
);

export default DefaultCreateConnector;
