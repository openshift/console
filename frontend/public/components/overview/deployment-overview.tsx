import * as React from 'react';

import { DeploymentModel } from '../../models';
import {
  DeploymentDetailsList,
  menuActions,
} from '../deployment';
import {
  LoadingInline,
  ResourceSummary,
  WorkloadPausedAlert,
} from '../utils';

import { OverviewDetailsResourcesTab } from './resource-overview-page';
import { OverviewItem } from '.';
import { ResourceOverviewDetails } from './resource-overview-details';
import { PodRing } from '@console/shared';

const DeploymentOverviewDetails: React.SFC<DeploymentOverviewDetailsProps> = ({item: {obj: d, pods: pods}}) => {
  return <div className="overview__sidebar-pane-body resource-overview__body">
    {d.spec.paused && <WorkloadPausedAlert obj={d} model={DeploymentModel} />}
    <div className="resource-overview__pod-counts">
      <PodRing pods={pods}
        obj={d}
        resourceKind={DeploymentModel}
        path="/spec/replicas" />
    </div>
    <div className="resource-overview__summary">
      <ResourceSummary resource={d} showPodSelector showNodeSelector showTolerations>
        <dt>Status</dt>
        <dd>
          {
            d.status.availableReplicas === d.status.updatedReplicas
              ? 'Active'
              : <div>
                <span className="co-icon-space-r"><LoadingInline /></span> Updating
              </div>
          }
        </dd>
      </ResourceSummary>
    </div>
    <div className="resource-overview__details">
      <DeploymentDetailsList deployment={d} />
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

type DeploymentOverviewDetailsProps = {
  item: OverviewItem;
};

type DeploymentOverviewProps = {
  item: OverviewItem;
};
