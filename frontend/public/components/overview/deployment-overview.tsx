import * as React from 'react';

import { OverviewItem, usePodsWatcher } from '@console/shared';
import PodRingSet from '@console/shared/src/components/pod/PodRingSet';
import { DeploymentModel } from '../../models';
import { DeploymentKind } from '../../module/k8s';
import { DeploymentDetailsList, menuActions } from '../deployment';
import {
  KebabAction,
  LoadingInline,
  ResourceSummary,
  StatusBox,
  WorkloadPausedAlert,
} from '../utils';

import { OverviewDetailsResourcesTab } from './resource-overview-page';
import { ResourceOverviewDetails } from './resource-overview-details';

const DeploymentOverviewDetails: React.SFC<DeploymentOverviewDetailsProps> = ({
  item: { obj: d },
}) => {
  const { namespace } = d.metadata;
  const { podData, loaded, loadError } = usePodsWatcher(d, 'Deployment', namespace);
  return (
    <div className="overview__sidebar-pane-body resource-overview__body">
      {d.spec.paused && <WorkloadPausedAlert obj={d} model={DeploymentModel} />}
      <div className="resource-overview__pod-counts">
        <StatusBox loaded={loaded} data={podData} loadError={loadError}>
          <PodRingSet
            key={d.metadata.uid}
            podData={podData}
            obj={d}
            resourceKind={DeploymentModel}
            path="/spec/replicas"
          />
        </StatusBox>
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
