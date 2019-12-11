import * as React from 'react';
import { Edge } from '@console/topology';

const TaskEdge: React.FC<{ element: Edge }> = ({ element }) => {
  const startPoint = element.getStartPoint();
  const endPoint = element.getEndPoint();

  const linePoints = [];
  linePoints.push(`M ${startPoint.x},${startPoint.y}`);
  if (startPoint.y !== endPoint.y) {
    // Different levels, bend up to the line
    const d = startPoint.x > endPoint.x ? -1 : 1;
    const bendDistance = Math.floor(Math.abs(startPoint.x - endPoint.x) / 2);
    // const distance = 0.9;

    const point1X = startPoint.x + bendDistance * d;
    // const cornerPointPre1 = `${point1X * distance},${startPoint.y}`;
    const cornerPoint1 = `${point1X},${startPoint.y}`;
    // const cornerPointPost1 = `${point1X},${(startPoint.y - endPoint.y) * distance + endPoint.y}`;
    // linePoints.push(`L ${cornerPointPre1} Q ${cornerPoint1} ${cornerPointPost1}`);
    linePoints.push(`L ${cornerPoint1}`);

    const cornerPointB = `${endPoint.x - bendDistance * d},${endPoint.y}`;

    linePoints.push(`L ${cornerPointB}`);
  }
  linePoints.push(`L ${endPoint.x},${endPoint.y}`);

  return (
    <path
      d={linePoints.join(' ')}
      stroke="var(--pf-global--BorderColor--light-100)"
      fill="none"
      style={{ shapeRendering: 'crispEdges' }}
    />
  );
};

export default TaskEdge;
