import * as React from 'react';
import { PodControllerOverviewItem } from '@console/shared';
import { ResourceLink, SidebarSectionHeading } from '@console/internal/components/utils';

type DeploymentOverviewListProps = {
  current: PodControllerOverviewItem;
};

const DeploymentOverviewList: React.FC<DeploymentOverviewListProps> = ({ current }) => {
  const { obj } = current || {};
  const namespace = obj?.metadata?.namespace;
  const deploymentData = obj?.metadata?.ownerReferences[0];
  return (
    <>
      <SidebarSectionHeading text="Deployment" />
      {deploymentData && deploymentData.name ? (
        <ul className="list-group">
          <li className="list-group-item">
            <ResourceLink
              kind={deploymentData.kind}
              name={deploymentData.name}
              namespace={namespace}
            />
          </li>
        </ul>
      ) : (
        <span className="text-muted">No Deployment found for this resource.</span>
      )}
    </>
  );
};

export default DeploymentOverviewList;
