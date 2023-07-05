import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { DeploymentConfigDeprecationAlert } from '@console/internal/components/deployment-config';
import { DeploymentConfigModel } from '@console/internal/models';
import TopologyActions from '../../../actions/TopologyActions';
import { useDetailsResourceLink } from '../providers/useDetailsResourceLink';
import SideBarAlerts from './SideBarAlerts';
import './SideBarHeading.scss';

const SideBarHeading: React.FC<{ element: GraphElement }> = ({ element }) => {
  const resourceLabel = element.getLabel();
  const resourceLink = useDetailsResourceLink(element);
  const resourceKind = element.getData()?.resource?.kind;
  return (
    <div className="overview__sidebar-pane-head resource-overview__heading">
      <h1 className="co-m-pane__heading">
        <div className="co-m-pane__name co-resource-item">{resourceLink ?? resourceLabel}</div>
        <div className="co-actions">
          <TopologyActions element={element} />
        </div>
      </h1>
      {resourceKind === DeploymentConfigModel.kind && (
        <div className="dc-deprecation-sidebar-alert">
          <DeploymentConfigDeprecationAlert />
        </div>
      )}
      <div className="odc-topology-sidebar-alert">
        <SideBarAlerts element={element} />
      </div>
    </div>
  );
};

export default SideBarHeading;
