import * as React from 'react';
import { Edge, GraphElement } from '@patternfly/react-topology';
import { DetailsTabSectionExtensionHook } from '@console/dynamic-plugin-sdk/src/extensions/topology-details';
import { TYPE_CONNECTS_TO } from '../../const';
import TopologyEdgeResourcesPanel from '../side-bar/TopologyEdgeResourcesPanel';

export const useVisualConnectorResourceTabSection: DetailsTabSectionExtensionHook = (
  element: GraphElement,
) => {
  if (element.getType() !== TYPE_CONNECTS_TO) {
    return [undefined, true, undefined];
  }
  const section = <TopologyEdgeResourcesPanel edge={element as Edge} />;
  return [section, true, undefined];
};
