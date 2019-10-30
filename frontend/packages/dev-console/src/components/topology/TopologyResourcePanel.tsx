import * as React from 'react';
import { ResourceOverviewPage } from '@console/internal/components/overview/resource-overview-page';
import * as _ from 'lodash';
import { KnativeOverviewPage } from '@console/knative-plugin/src/components/overview/KnativeResourceOverviewPage';
import { TopologyDataObject } from './topology-types';

export type TopologyResourcePanelProps = {
  item: TopologyDataObject;
};

const TopologyResourcePanel: React.FC<TopologyResourcePanelProps> = ({ item }) => {
  const resourceItemToShowOnSideBar = item && item.resources;
  if (_.get(item, 'data.isKnativeResource', false)) {
    return <KnativeOverviewPage item={item.resources} />;
  }
  return (
    resourceItemToShowOnSideBar && (
      <ResourceOverviewPage
        item={resourceItemToShowOnSideBar}
        kind={resourceItemToShowOnSideBar.obj.kind}
      />
    )
  );
};

export default TopologyResourcePanel;
