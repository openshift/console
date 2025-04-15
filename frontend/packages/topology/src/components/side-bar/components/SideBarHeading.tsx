import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { DeploymentConfigDeprecationAlert } from '@console/internal/components/deployment-config';
import { BasePageHeading } from '@console/internal/components/utils/headings';
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
      <BasePageHeading
        hideFavoriteButton
        title={<>{resourceLink ?? resourceLabel}</>}
        primaryAction={<TopologyActions element={element} />}
        helpAlert={
          <>
            {resourceKind === DeploymentConfigModel.kind && (
              <div className="dc-deprecation-sidebar-alert">
                <DeploymentConfigDeprecationAlert />
              </div>
            )}
            <div className="odc-topology-sidebar-alert">
              <SideBarAlerts element={element} />
            </div>
          </>
        }
      />
    </div>
  );
};

export default SideBarHeading;
