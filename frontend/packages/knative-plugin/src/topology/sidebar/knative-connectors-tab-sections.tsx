import * as React from 'react';
import { Edge } from '@patternfly/react-topology';
import TopologyEdgeResourcesPanel from '@console/topology/src/components/side-bar/TopologyEdgeResourcesPanel';
import {
  TYPE_EVENT_SOURCE_LINK,
  TYPE_KAFKA_CONNECTION_LINK,
  TYPE_REVISION_TRAFFIC,
} from '../const';

export const getKnativeConnectorSidepanelResourceSection = (element: Edge) => {
  if (
    ![TYPE_REVISION_TRAFFIC, TYPE_EVENT_SOURCE_LINK, TYPE_KAFKA_CONNECTION_LINK].includes(
      element.getType(),
    )
  ) {
    return undefined;
  }
  return <TopologyEdgeResourcesPanel edge={element} />;
};
