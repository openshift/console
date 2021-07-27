import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import * as _ from 'lodash';
import KnativeResourceOverviewPage from '@console/knative-plugin/src/components/overview/KnativeResourceOverviewPage';
// import { ModifyApplication } from '../../actions/modify-application';
import TopologySideBarContent from './TopologySideBarContent';

type TopologyResourcePanelProps = {
  element: GraphElement;
};

const TopologyResourcePanel: React.FC<TopologyResourcePanelProps> = ({ element }) => {
  const item = element.getData();

  // adds extra check, custom sidebar for all knative resources excluding deployment
  const itemKind = item?.resource?.kind ?? null;
  if (_.get(item, 'data.isKnativeResource', false) && itemKind && itemKind !== 'Deployment') {
    return <KnativeResourceOverviewPage item={item.resources} />;
  }

  // const customActions = [ModifyApplication];

  return <TopologySideBarContent element={element} />;
};

export default TopologyResourcePanel;
