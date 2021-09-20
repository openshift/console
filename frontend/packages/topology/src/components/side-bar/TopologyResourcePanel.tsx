import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import * as _ from 'lodash';
import { ResourceOverviewPage } from '@console/internal/components/overview/resource-overview-page';
import KnativeResourceOverviewPage from '@console/knative-plugin/src/components/overview/KnativeResourceOverviewPage';
import { TYPE_WORKLOAD } from '../../const';
import TopologySideBarContent from './TopologySideBarContent';

type TopologyResourcePanelProps = {
  element: GraphElement;
};

const TopologyResourcePanel: React.FC<TopologyResourcePanelProps> = ({ element }) => {
  const item = element.getData();
  const resourceItemToShowOnSideBar = item && item.resources;
  // adds extra check, custom sidebar for all knative resources excluding deployment
  const itemKind = item?.resource?.kind ?? null;
  if (_.get(item, 'data.isKnativeResource', false) && itemKind && itemKind !== 'Deployment') {
    return <KnativeResourceOverviewPage item={item.resources} element={element} />;
  }
  if (element.getType() === TYPE_WORKLOAD) return <TopologySideBarContent element={element} />;
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
