import * as React from 'react';
import { Node } from '@patternfly/react-topology';
import ShipwrightBuildDecorator from './ShipwrightBuildDecorator';

export const getShipWrightBuildDecorator = (
  element: Node,
  radius: number,
  x: number,
  y: number,
) => {
  const overviewItem = element.getData()?.resources;

  const { builds, buildRuns, obj } = overviewItem || {};

  if (!buildRuns) {
    return null;
  }

  return (
    <ShipwrightBuildDecorator
      key="shipwright-buildruns"
      radius={radius}
      x={x}
      y={y}
      build={builds}
      buildRuns={buildRuns}
      resource={obj}
    />
  );
};
