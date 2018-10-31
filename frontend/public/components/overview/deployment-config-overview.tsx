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

import { BuildConfigsOverview } from './build-configs-overview';
import { NetworkingOverview } from './networking-overview';
import { ResourceOverviewDetails } from './resource-overview-details';

const DeploymentConfigOverviewDetails: React.SFC<{item:any}> = ({item: {obj: dc}}) => {
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

const DeploymentConfigResources: React.SFC<{item:any}> = ({item: {buildConfigs, routes, services}}) => (
  <div className="overview__sidebar-pane-body">
    <BuildConfigsOverview buildConfigs={buildConfigs} />
    <NetworkingOverview routes={routes} services={services} />
  </div>
);

const tabs = [
  {
    name: 'Overview',
    component: DeploymentConfigOverviewDetails
  },
  {
    name: 'Resources',
    component: DeploymentConfigResources
  }
];

export const DeploymentConfigOverviewPage: React.SFC<{item:any}> = ({item}) =>
  <ResourceOverviewDetails
    item={item}
    kindObj={DeploymentConfigModel}
    menuActions={menuActions}
    tabs={tabs}
  />;
