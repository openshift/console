import type { FC } from 'react';
import type { GraphElement } from '@patternfly/react-topology';
import { DeploymentConfigDeprecationAlert } from '@console/internal/components/deployment-config';
import { DeploymentConfigModel } from '@console/internal/models';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import TopologyActions from '../../../actions/TopologyActions';
import { useDetailsResourceLink } from '../providers/useDetailsResourceLink';
import SideBarAlerts from './SideBarAlerts';
import './SideBarHeading.scss';

const SideBarHeading: FC<{ element: GraphElement }> = ({ element }) => {
  const resourceLabel = element.getLabel();
  const resourceLink = useDetailsResourceLink(element);
  const resourceKind = element.getData()?.resource?.kind;
  return (
    <div className="overview__sidebar-pane-head resource-overview__heading">
      <PageHeading
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
