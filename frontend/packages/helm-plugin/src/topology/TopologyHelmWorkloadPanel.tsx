import * as React from 'react';
import { ResourceOverviewPage } from '@console/internal/components/overview/resource-overview-page';
import { TopologyDataObject } from '@console/topology/src/topology-types';

export type TopologyResourcePanelProps = {
  item: TopologyDataObject;
};

const TopologyHelmWorkloadPanel: React.FC<TopologyResourcePanelProps> = ({ item }) => {
  const resourceItemToShowOnSideBar = item && item.resources;

  return (
    resourceItemToShowOnSideBar && (
      <ResourceOverviewPage
        item={resourceItemToShowOnSideBar}
        kind={resourceItemToShowOnSideBar.obj.kind}
      />
    )
  );
};

export default TopologyHelmWorkloadPanel;
