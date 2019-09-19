import * as React from 'react';
import { ResourceIcon } from '@console/internal/components/utils';
import { TopologyApplicationObject } from './topology-types';

export type TopologyApplicationPanelProps = {
  application: TopologyApplicationObject;
};

const TopologyApplicationPanel: React.FC<TopologyApplicationPanelProps> = ({ application }) => (
  <div className="overview__sidebar-pane resource-overview">
    <div className="overview__sidebar-pane-head resource-overview__heading">
      <h1 className="co-m-pane__heading">
        <div className="co-m-pane__name co-resource-item">
          <ResourceIcon className="co-m-resource-icon--lg" kind="application" />
          {application.name}
        </div>
      </h1>
    </div>
    <div className="overview__sidebar-pane-body resource-overview__body" />
  </div>
);

export default TopologyApplicationPanel;
