import * as React from 'react';
import { Node } from '@patternfly/react-topology/src/types';
import { TYPE_HELM_RELEASE } from './const';
import HelmReleaseStatusDecorator from './HelmReleaseStatusDecorator';

export const getHelmReleaseStatusDecorator = (
  element: Node,
  radius: number,
  x: number,
  y: number,
) => {
  if (element.getType() !== TYPE_HELM_RELEASE || element.isCollapsed()) {
    return null;
  }

  return <HelmReleaseStatusDecorator element={element} radius={radius} x={x} y={y} />;
};
