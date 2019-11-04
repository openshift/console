import * as React from 'react';
import Point from '../geom/Point';
import './DefaultCreateConnector.scss';
import ConnectorArrow from './ConnectorArrow';

type DefaultCreateConnectorProps = {
  startPoint: Point;
  endPoint: Point;
};

const DefaultCreateConnector: React.FC<DefaultCreateConnectorProps> = ({
  startPoint,
  endPoint,
}) => (
  <g className="topology-default-create-connector">
    <ConnectorArrow startPoint={startPoint} endPoint={endPoint} />
    <line
      className="topology-default-create-connector__line"
      x1={startPoint.x}
      y1={startPoint.y}
      x2={endPoint.x}
      y2={endPoint.y}
    />
  </g>
);

export default DefaultCreateConnector;
