import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { TopologyActions } from '../../../actions';
import { useDetailsResourceLink } from '../providers/useDetailsResourceLink';
import SideBarAlerts from './SideBarAlerts';
import './SideBarHeading.scss';

const SideBarHeading: React.FC<{ element: GraphElement }> = ({ element }) => {
  const resourceLabel = element.getLabel();
  const resourceLink = useDetailsResourceLink(element);
  return (
    <div className="overview__sidebar-pane-head resource-overview__heading">
      <h1 className="co-m-pane__heading">
        <div className="co-m-pane__name co-resource-item">{resourceLink ?? resourceLabel}</div>
        <div className="co-actions">
          <TopologyActions element={element} />
        </div>
      </h1>
      <div className="odc-topology-sidebar-alert">
        <SideBarAlerts element={element} />
      </div>
    </div>
  );
};

export default SideBarHeading;
