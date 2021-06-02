import * as React from 'react';
import { ResourceIcon, ActionsMenu } from '@console/internal/components/utils';
import { groupActions } from '../../actions/groupActions';
import { GraphData, TopologyApplicationObject } from '../../topology-types';
import TopologyApplicationResources from './TopologyApplicationResources';

type TopologyApplicationPanelProps = {
  graphData: GraphData;
  application: TopologyApplicationObject;
};

const TopologyApplicationPanel: React.FC<TopologyApplicationPanelProps> = ({
  graphData,
  application,
}) => (
  <div className="overview__sidebar-pane resource-overview">
    <div className="overview__sidebar-pane-head resource-overview__heading">
      <h1 className="co-m-pane__heading">
        <div className="co-m-pane__name co-resource-item">
          <ResourceIcon className="co-m-resource-icon--lg" kind="application" />
          {application.name}
        </div>
        <div className="co-actions">
          <ActionsMenu actions={groupActions(graphData, application)} />
        </div>
      </h1>
    </div>
    <TopologyApplicationResources resources={application.resources} group={application.name} />
  </div>
);

export default TopologyApplicationPanel;
