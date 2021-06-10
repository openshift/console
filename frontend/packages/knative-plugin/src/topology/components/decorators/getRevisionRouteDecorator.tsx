import * as React from 'react';
import { Node } from '@patternfly/react-topology';
import RevisionRouteDecorator from './RevisionRouteDecorator';

export const getRevisionRouteDecorator = (element: Node, radius: number, x: number, y: number) => {
  return <RevisionRouteDecorator key="url" element={element} radius={radius} x={x} y={y} />;
};
