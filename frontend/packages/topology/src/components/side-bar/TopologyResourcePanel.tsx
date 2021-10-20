import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import KnativeResourceOverviewPage from '@console/knative-plugin/src/components/overview/KnativeResourceOverviewPage';
import { TYPE_WORKLOAD } from '../../const';
import TopologySideBarContent from './TopologySideBarContent';

type TopologyResourcePanelProps = {
  element: GraphElement;
};

const TopologyResourcePanel: React.FC<TopologyResourcePanelProps> = ({ element }) => {
  const item = element.getData();
  // adds extra check, custom sidebar for all knative resources excluding deployment
  const itemKind = item?.resource?.kind ?? null;
  if (item?.data?.isKnativeResource && itemKind && itemKind !== 'Deployment') {
    return <KnativeResourceOverviewPage item={item.resources} element={element} />;
  }
  if (element.getType() === TYPE_WORKLOAD) return <TopologySideBarContent element={element} />;
  return <TopologySideBarContent element={element} />;
};

export default TopologyResourcePanel;
