import * as React from 'react';

import { DeploymentConfigModel } from '../../models';
import { DeploymentConfigDetailsList, menuActions } from '../deployment-config';
import { KebabAction, LoadingInline, ResourceSummary, WorkloadPausedAlert } from '../utils';

import { OverviewDetailsResourcesTab } from './resource-overview-page';
import { ResourceOverviewDetails } from './resource-overview-details';
import PodRingSet from '@console/shared/src/components/pod/PodRingSet';
import { OverviewItem } from '@console/shared';

const DeploymentConfigOverviewDetails: React.SFC<DeploymentConfigOverviewDetailsProps> = ({
  item: { obj: dc, pods: pods, current, previous, isRollingOut },
}) => {
  return (
    <div className="overview__sidebar-pane-body resource-overview__body">
      {dc.spec.paused && <WorkloadPausedAlert obj={dc} model={DeploymentConfigModel} />}
      <div className="resource-overview__pod-counts">
        <PodRingSet
          key={dc.metadata.uid}
          podData={{
            pods,
            current,
            previous,
            isRollingOut,
          }}
          obj={dc}
          resourceKind={DeploymentConfigModel}
          path="/spec/replicas"
        />
      </div>
      <div className="resource-overview__summary">
        <ResourceSummary resource={dc} showPodSelector showNodeSelector showTolerations>
          <dt>Status</dt>
          <dd>
            {dc.status.availableReplicas === dc.status.updatedReplicas ? (
              'Active'
            ) : (
              <div>
                <span className="co-icon-space-r">
                  <LoadingInline />
                </span>{' '}
                Updating
              </div>
            )}
          </dd>
        </ResourceSummary>
      </div>
      <div className="resource-overview__details">
        <DeploymentConfigDetailsList dc={dc} />
      </div>
    </div>
  );
};

const tabs = [
  {
    name: 'Details',
    component: DeploymentConfigOverviewDetails,
  },
  {
    name: 'Resources',
    component: OverviewDetailsResourcesTab,
  },
];

export const DeploymentConfigOverviewPage: React.SFC<DeploymentConfigOverviewProps> = ({
  item,
  customActions,
}) => (
  <ResourceOverviewDetails
    item={item}
    kindObj={DeploymentConfigModel}
    menuActions={customActions ? [...customActions, ...menuActions] : menuActions}
    tabs={tabs}
  />
);

type DeploymentConfigOverviewDetailsProps = {
  item: OverviewItem;
};

type DeploymentConfigOverviewProps = {
  item: OverviewItem;
  customActions?: KebabAction[];
};
