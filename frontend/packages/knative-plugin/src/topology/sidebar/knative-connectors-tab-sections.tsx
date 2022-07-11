import * as React from 'react';
import { Edge } from '@patternfly/react-topology';
import { DetailsTabSectionExtensionHook } from '@console/dynamic-plugin-sdk/src/extensions/topology-details';
import TopologyEdgeResourcesPanel from '@console/topology/src/components/side-bar/TopologyEdgeResourcesPanel';
import {
  TYPE_EVENT_SINK_LINK,
  TYPE_EVENT_SOURCE_LINK,
  TYPE_KAFKA_CONNECTION_LINK,
  TYPE_REVISION_TRAFFIC,
} from '../const';

export const useKnativeConnectorSidepanelResourceSection: DetailsTabSectionExtensionHook = (
  element: Edge,
) => {
  if (
    ![
      TYPE_REVISION_TRAFFIC,
      TYPE_EVENT_SOURCE_LINK,
      TYPE_KAFKA_CONNECTION_LINK,
      TYPE_EVENT_SINK_LINK,
    ].includes(element.getType())
  ) {
    return [undefined, true, undefined];
  }
  const section = <TopologyEdgeResourcesPanel edge={element} />;
  return [section, true, undefined];
};
