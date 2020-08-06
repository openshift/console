import * as React from 'react';
import { ResourceOverviewPage } from '@console/internal/components/overview/resource-overview-page';
import * as _ from 'lodash';
import KnativeResourceOverviewPage from '@console/knative-plugin/src/components/overview/KnativeResourceOverviewPage';
import { TopologyDataObject } from './topology-types';
import { ModifyApplication } from '../../actions/modify-application';

export type TopologyResourcePanelProps = {
  item: TopologyDataObject;
};

const TopologyResourcePanel: React.FC<TopologyResourcePanelProps> = ({ item }) => {
  const resourceItemToShowOnSideBar = item && item.resources;

  // adds extra check, custom sidebar for all knative resources excluding deployment
  const itemKind = item?.resource?.kind ?? null;
  if (_.get(item, 'data.isKnativeResource', false) && itemKind && itemKind !== 'Deployment') {
    return <KnativeResourceOverviewPage item={item.resources} />;
  }

  const customActions = [ModifyApplication];

  return (
    resourceItemToShowOnSideBar && (
      <ResourceOverviewPage
        item={resourceItemToShowOnSideBar}
        kind={resourceItemToShowOnSideBar.obj.kind}
        customActions={customActions}
      />
    )
  );
};

export default TopologyResourcePanel;
