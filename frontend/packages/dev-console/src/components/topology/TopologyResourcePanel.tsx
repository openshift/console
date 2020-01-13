import * as React from 'react';
import { ResourceOverviewPage } from '@console/internal/components/overview/resource-overview-page';
import * as _ from 'lodash';
import KnativeResourceOverviewPage from '@console/knative-plugin/src/components/overview/KnativeResourceOverviewPage';
import { TopologyDataObject } from './topology-types';

export type TopologyResourcePanelProps = {
  item: TopologyDataObject;
};

const TopologyResourcePanel: React.FC<TopologyResourcePanelProps> = ({ item }) => {
  const resourceItemToShowOnSideBar = item && item.resources;
  // adds extra check, custom sidebar for all knative resources excluding deployment
  const itemKind = _.get(item, 'data.kind', null);
  if (_.get(item, 'data.isKnativeResource', false) && itemKind && itemKind !== 'Deployment') {
    return <KnativeResourceOverviewPage item={item.resources} />;
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
