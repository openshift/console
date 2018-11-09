import * as React from 'react';

import { DeploymentConfigModel } from '../../models';
import {
  DeploymentConfigDetailsList,
  menuActions
} from '../deployment-config';
import {
  DeploymentPodCounts,
  LoadingInline,
  ResourceSummary,
} from '../utils';

import { OverviewDetailsResourcesTab } from './resource-overview-page';
import { OverviewItem } from '.';
import { ResourceOverviewDetails } from './resource-overview-details';

const DeploymentConfigOverviewDetails: React.SFC<DeploymentConfigOverviewDetailsProps> = ({item: {obj: dc}}) => {
  return <div className="overview__sidebar-pane-body resource-overview__body">
    <div className="resource-overview__pod-counts">
      <DeploymentPodCounts resource={dc} resourceKind={DeploymentConfigModel} />
    </div>
    <div className="resource-overview__summary">
      <ResourceSummary resource={dc}>
        <dt>Status</dt>
        <dd>
          {
            dc.status.availableReplicas === dc.status.updatedReplicas
              ? 'Active'
              : <div>
                <span className="co-icon-space-r"><LoadingInline /></span> Updating
              </div>
          }
        </dd>
      </ResourceSummary>
    </div>
    <div className="resource-overview__details">
      <DeploymentConfigDetailsList dc={dc} />
    </div>
  </div>;
};

const tabs = [
  {
    name: 'Overview',
    component: DeploymentConfigOverviewDetails
  },
  {
    name: 'Resources',
    component: OverviewDetailsResourcesTab
  }
];

export const DeploymentConfigOverviewPage: React.SFC<DeploymentConfigOverviewProps> = ({item}) =>
  <ResourceOverviewDetails
    item={item}
    kindObj={DeploymentConfigModel}
    menuActions={menuActions}
    tabs={tabs}
  />;

/* eslint-disable no-unused-vars, no-undef */
type DeploymentConfigOverviewDetailsProps = {
  item: OverviewItem;
};

type DeploymentConfigOverviewProps = {
  item: OverviewItem;
};
/* eslint-enable no-unused-vars, no-undef */
