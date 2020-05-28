import * as React from 'react';

import { DeploymentModel } from '../../models';
import { DeploymentKind } from '../../module/k8s';
import { DeploymentDetailsList, menuActions } from '../deployment';
import { KebabAction, LoadingInline, ResourceSummary, WorkloadPausedAlert } from '../utils';

import { OverviewDetailsResourcesTab } from './resource-overview-page';
import { ResourceOverviewDetails } from './resource-overview-details';
import PodRingSet from '@console/shared/src/components/pod/PodRingSet';
import { OverviewItem } from '@console/shared';

const DeploymentOverviewDetails: React.SFC<DeploymentOverviewDetailsProps> = ({
  item: { obj: d, pods: pods, current, previous, isRollingOut },
}) => {
  return (
    <div className="overview__sidebar-pane-body resource-overview__body">
      {d.spec.paused && <WorkloadPausedAlert obj={d} model={DeploymentModel} />}
      <div className="resource-overview__pod-counts">
        <PodRingSet
          key={d.metadata.uid}
          podData={{
            pods,
            current,
            previous,
            isRollingOut,
          }}
          obj={d}
          resourceKind={DeploymentModel}
          path="/spec/replicas"
        />
      </div>
      <div className="resource-overview__summary">
        <ResourceSummary resource={d} showPodSelector showNodeSelector showTolerations>
          <dt>Status</dt>
          <dd>
            {d.status.availableReplicas === d.status.updatedReplicas ? (
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
        <DeploymentDetailsList deployment={d} />
      </div>
    </div>
  );
};

const tabs = [
  {
    name: 'Details',
    component: DeploymentOverviewDetails,
  },
  {
    name: 'Resources',
    component: OverviewDetailsResourcesTab,
  },
];

export const DeploymentOverviewPage: React.SFC<DeploymentOverviewProps> = ({
  item,
  customActions,
}) => (
  <ResourceOverviewDetails
    item={item}
    kindObj={DeploymentModel}
    menuActions={customActions ? [...customActions, ...menuActions] : menuActions}
    tabs={tabs}
  />
);

type DeploymentOverviewDetailsProps = {
  item: OverviewItem<DeploymentKind>;
};

type DeploymentOverviewProps = {
  item: OverviewItem<DeploymentKind>;
  customActions?: KebabAction[];
};
