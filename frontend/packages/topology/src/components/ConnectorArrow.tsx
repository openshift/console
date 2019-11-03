import * as React from 'react';
import { observer } from 'mobx-react';
import * as classNames from 'classnames';
import * as _ from 'lodash';
import Point from '../geom/Point';
import { Edge } from '../types';
import { ConnectDragSource } from '../behavior/dnd-types';

type ConnectorArrowProps = {
  edge: Edge;
  className?: string;
  isTarget?: boolean;
  size?: number;
  dragRef?: ConnectDragSource | undefined;
};

const pointsStringFromPoints = (points: [number, number][]): string => {
  return _.reduce(
    points,
    (result: string, nextPoint: [number, number]) => {
      return `${result} ${nextPoint[0]},${nextPoint[1]}`;
    },
    '',
  );
};

const ConnectorArrow: React.FC<ConnectorArrowProps> = ({
  edge,
  className = '',
  isTarget = true,
  size = 10,
  dragRef,
}) => {
  const bendPoints = edge.getBendpoints();
  const endPoint: [number, number] = isTarget
    ? [edge.getEndPoint().x, edge.getEndPoint().y]
    : [edge.getStartPoint().x, edge.getStartPoint().y];
  const prevPoint: Point = isTarget
    ? _.last(bendPoints) || edge.getStartPoint()
    : _.head(bendPoints) || edge.getEndPoint();

  if (!prevPoint || !endPoint) {
    return null;
  }
  const length = Math.sqrt((endPoint[0] - prevPoint.x) ** 2 + (endPoint[1] - prevPoint.y) ** 2);
  if (!length) {
    return null;
  }

  const ratio = (length - size) / length;
  const startPoint: [number, number] = [
    prevPoint.x + (endPoint[0] - prevPoint.x) * ratio,
    prevPoint.y + (endPoint[1] - prevPoint.y) * ratio,
  ];

  const arrowPoints: [number, number][] = [[0, size / 2], [0, -size / 2], [size, 0]];
  const padding = Math.max(size, 8);
  const deltaY = padding / 2;
  const boundingBox: [number, number][] = [
    [0, -deltaY],
    [padding, -deltaY],
    [padding, deltaY],
    [0, deltaY],
  ];

  const angleDeg =
    180 - (Math.atan2(endPoint[1] - prevPoint.y, prevPoint.x - endPoint[0]) * 180) / Math.PI;

  return (
    <g
      transform={`translate(${startPoint[0]}, ${startPoint[1]}) rotate(${angleDeg})`}
      ref={dragRef}
      className={classNames('topology-connector-arrow', className)}
    >
      <polygon points={pointsStringFromPoints(arrowPoints)} />
      <polygon points={pointsStringFromPoints(boundingBox)} fillOpacity={0} strokeWidth={0} />
    </g>
  );
};

export default observer(ConnectorArrow);
