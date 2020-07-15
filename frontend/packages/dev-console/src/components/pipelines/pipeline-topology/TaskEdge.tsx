import * as React from 'react';
import { Edge, Point } from '@patternfly/react-topology';
import { integralShapePath } from './draw-utils';

const TaskEdge: React.FC<{ element: Edge }> = ({ element }) => {
  const startPoint: Point = element.getStartPoint();
  const endPoint: Point = element.getEndPoint();
  const sourceNode = element.getSource();
  const targetNode = element.getTarget();

  return (
    <path
      d={integralShapePath(
        startPoint.clone().translate(sourceNode.getBounds().width / 2 - 1, 0),
        endPoint.clone().translate(-targetNode.getBounds().width / 2, 0),
      )}
      stroke="var(--pf-global--BorderColor--light-100)"
      fill="none"
      transform="translate(0.5,0.5)"
    />
  );
};

export default TaskEdge;
