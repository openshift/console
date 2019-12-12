import * as React from 'react';
import { Edge, Point } from '@console/topology';
import { path } from './utils';

const TaskEdge: React.FC<{ element: Edge }> = ({ element }) => {
  const startPoint: Point = element.getStartPoint();
  const endPoint: Point = element.getEndPoint();

  return (
    <path
      d={path(startPoint, endPoint)}
      stroke="var(--pf-global--BorderColor--light-100)"
      fill="none"
      style={{ shapeRendering: 'crispEdges' }}
    />
  );
};

export default TaskEdge;
