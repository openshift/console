import * as React from 'react';
import { TrashIcon } from '@patternfly/react-icons';
import Point from '../geom/Point';

type DefaultRemoveConnectorProps = {
  startPoint: Point;
  endPoint: Point;
  onRemove(): void;
  size?: number;
};

const DefaultRemoveConnector: React.FC<DefaultRemoveConnectorProps> = ({
  startPoint,
  endPoint,
  onRemove,
  size = 14,
}) => (
  <g
    transform={`translate(${startPoint.x + (endPoint.x - startPoint.x) * 0.5}, ${startPoint.y +
      (endPoint.y - startPoint.y) * 0.5})`}
    onClick={(e) => {
      e.stopPropagation();
      onRemove();
    }}
  >
    <circle className="topology-connector__remove-bg" cx={0} cy={0} r={size} />
    <g transform={`translate(-${size / 2}, -${size / 2})`}>
      <TrashIcon
        className="topology-connector__remove-icon"
        style={{ fontSize: size }}
        alt="Remove Connection"
      />
    </g>
  </g>
);

export default DefaultRemoveConnector;
