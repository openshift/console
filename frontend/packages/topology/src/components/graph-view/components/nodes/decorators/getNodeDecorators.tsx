import * as React from 'react';
import { Node } from '@patternfly/react-topology';
import { TopologyDecorator, TopologyDecoratorQuadrant } from '../../../../../topology-types';

const getExtensionDecoratorForQuadrant = (
  location: string,
  element: Node,
  decorators: { [key: string]: TopologyDecorator[] },
  centerX: number,
  centerY: number,
  nodeRadius: number,
  decoratorRadius: number,
  nodeWidth: number,
  nodeHeight: number,
): React.ReactElement => {
  let x: number;
  let y: number;
  const deltaX = nodeRadius > 0 ? nodeRadius : nodeWidth / 2;
  const deltaY = nodeRadius > 0 ? nodeRadius : nodeHeight / 2;
  const offset = nodeRadius > 0 ? decoratorRadius * 0.7 : 0;
  switch (location) {
    case TopologyDecoratorQuadrant.upperRight:
      x = centerX + deltaX - offset;
      y = centerY - deltaY + offset;
      break;
    case TopologyDecoratorQuadrant.lowerRight:
      x = centerX + deltaX - offset;
      y = centerY + deltaY - offset;
      break;
    case TopologyDecoratorQuadrant.upperLeft:
      x = centerX - deltaX + offset;
      y = centerY - deltaY + offset;
      break;
    case TopologyDecoratorQuadrant.lowerLeft:
      x = centerX - deltaX + offset;
      y = centerY + deltaY - offset;
      break;
    default:
      x = centerX;
      y = centerY;
  }

  let retDecorator;
  let i = 0;
  const length = decorators?.[location]?.length ?? 0;
  while (!retDecorator && i < length) {
    retDecorator = decorators[location][i++].decorator(element, decoratorRadius, x, y);
  }
  return retDecorator;
};

export const getNodeDecorators = (
  element: Node,
  decorators: { [key: string]: TopologyDecorator[] },
  centerX: number,
  centerY: number,
  nodeRadius: number, // -1 to use width/height
  decoratorRadius: number,
  nodeWidth?: number,
  nodeHeight?: number,
): React.ReactNode => {
  const keys = decorators ? Object.keys(decorators) : [];
  return (
    <>
      {keys.map((key) =>
        getExtensionDecoratorForQuadrant(
          key,
          element,
          decorators,
          centerX,
          centerY,
          nodeRadius,
          decoratorRadius,
          nodeWidth,
          nodeHeight,
        ),
      )}
    </>
  );
};
