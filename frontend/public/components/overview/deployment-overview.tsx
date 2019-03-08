import * as React from 'react';

import { DeploymentModel } from '../../models';
import {
  DeploymentDetailsList,
  menuActions,
} from '../deployment';
import {
  DeploymentPodCounts,
  LoadingInline,
  ResourceSummary,
  WorkloadPausedAlert,
} from '../utils';

import { OverviewDetailsResourcesTab } from './resource-overview-page';
import { OverviewItem } from '.';
import { ResourceOverviewDetails } from './resource-overview-details';

const DeploymentOverviewDetails: React.SFC<DeploymentOverviewDetailsProps> = ({item}) => {
  return <div className="overview__sidebar-pane-body resource-overview__body">
    {item.obj.spec.paused && <WorkloadPausedAlert obj={item.obj} model={DeploymentModel} />}
    <div className="resource-overview__pod-counts">
      <DeploymentPodCounts resource={item.obj} resourceKind={DeploymentModel} />
    </div>
    <div className="resource-overview__summary">
      <ResourceSummary resource={item.obj} showPodSelector showNodeSelector>
        <dt>Status</dt>
        <dd>
          {
            item.obj.status.availableReplicas === item.obj.status.updatedReplicas
              ? 'Active'
              : <div>
                <span className="co-icon-space-r"><LoadingInline /></span> Updating
              </div>
          }
        </dd>
      </ResourceSummary>
    </div>
    <div className="resource-overview__details">
      <DeploymentDetailsList deployment={item.obj} />
    </div>
  </div>;
};

const tabs = [
  {
    name: 'Overview',
    component: DeploymentOverviewDetails,
  },
  {
    name: 'Resources',
    component: OverviewDetailsResourcesTab,
  },
];

export const DeploymentOverviewPage: React.SFC<DeploymentOverviewProps> = ({item}) =>
  <ResourceOverviewDetails
    item={item}
    kindObj={DeploymentModel}
    menuActions={menuActions}
    tabs={tabs}
  />;

/* eslint-disable no-unused-vars, no-undef */
type DeploymentOverviewDetailsProps = {
  item: OverviewItem;
};

type DeploymentOverviewProps = {
  item: OverviewItem;
};
/* eslint-enable no-unused-vars, no-undef */
