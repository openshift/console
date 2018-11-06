import * as React from 'react';

import { DeploymentModel } from '../../models';
import {
  DeploymentDetailsList,
  menuActions
} from '../deployment';
import {
  DeploymentPodCounts,
  LoadingInline,
  ResourceSummary,
} from '../utils';

import { NetworkingOverview } from './networking-overview';
import { ResourceOverviewDetails } from './resource-overview-details';
import { BuildConfigsOverview } from './build-configs-overview';

const DeploymentOverviewDetails: React.SFC<{item: any}> = ({item: {obj: deployment}}) => {
  return <div className="overview__sidebar-pane-body resource-overview__body">
    <div className="resource-overview__pod-counts">
      <DeploymentPodCounts resource={deployment} resourceKind={DeploymentModel} />
    </div>
    <div className="resource-overview__summary">
      <ResourceSummary resource={deployment}>
        <dt>Status</dt>
        <dd>
          {
            deployment.status.availableReplicas === deployment.status.updatedReplicas
              ? 'Active'
              : <div>
                <span className="co-icon-space-r"><LoadingInline /></span> Updating
              </div>
          }
        </dd>
      </ResourceSummary>
    </div>
    <div className="resource-overview__details">
      <DeploymentDetailsList deployment={deployment} />
    </div>
  </div>;
};

const DeploymentResourceOverview: React.SFC<{item: any}>= ({item: {buildConfigs, routes, services}}) => (
  <div className="overview__sidebar-pane-body">
    <BuildConfigsOverview buildConfigs={buildConfigs} />
    <NetworkingOverview services={services} routes={routes} />
  </div>
);

const tabs = [
  {
    name: 'Overview',
    component: DeploymentOverviewDetails
  },
  {
    name: 'Resources',
    component: DeploymentResourceOverview
  }
];

export const DeploymentOverviewPage: React.SFC<{item:any}> = ({item}) =>
  <ResourceOverviewDetails
    item={item}
    kindObj={DeploymentModel}
    menuActions={menuActions}
    tabs={tabs}
  />;
