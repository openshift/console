import * as React from 'react';
import { Edge, GraphElement } from '@patternfly/react-topology';
import { TYPE_CONNECTS_TO } from '../../const';
import TopologyEdgeResourcesPanel from '../side-bar/TopologyEdgeResourcesPanel';

export const getVisualConnectorResourceTabSection = (element: GraphElement) => {
  if (element.getType() !== TYPE_CONNECTS_TO) return undefined;
  return <TopologyEdgeResourcesPanel edge={element as Edge} />;
};
