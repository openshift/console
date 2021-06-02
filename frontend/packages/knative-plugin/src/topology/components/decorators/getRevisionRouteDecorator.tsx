import * as React from 'react';
import { Node } from '@patternfly/react-topology';
import { TYPE_KNATIVE_REVISION } from '../../const';
import RevisionRouteDecorator from './RevisionRouteDecorator';

export const getRevisionRouteDecorator = (element: Node, radius: number, x: number, y: number) => {
  if (element.getType() !== TYPE_KNATIVE_REVISION) {
    return null;
  }
  return <RevisionRouteDecorator key="url" element={element} radius={radius} x={x} y={y} />;
};
