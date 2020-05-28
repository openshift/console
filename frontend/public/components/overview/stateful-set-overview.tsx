import * as React from 'react';

import { StatefulSetModel } from '../../models';
import { menuActions } from '../stateful-set';
import { KebabAction, ResourceSummary } from '../utils';
import PodRingSet from '@console/shared/src/components/pod/PodRingSet';

import { OverviewDetailsResourcesTab } from './resource-overview-page';
import { ResourceOverviewDetails } from './resource-overview-details';
import { OverviewItem } from '@console/shared';

const StatefulSetOverviewDetails: React.SFC<StatefulSetOverviewDetailsProps> = ({
  item: { obj: ss, pods: pods, current, previous, isRollingOut },
}) => (
  <div className="overview__sidebar-pane-body resource-overview__body">
    <div className="resource-overview__pod-counts">
      <PodRingSet
        key={ss.metadata.uid}
        podData={{
          pods,
          current,
          previous,
          isRollingOut,
        }}
        obj={ss}
        resourceKind={StatefulSetModel}
        path="/spec/replicas"
      />
    </div>
    <ResourceSummary resource={ss} showPodSelector showNodeSelector showTolerations />
  </div>
);

const tabs = [
  {
    name: 'Details',
    component: StatefulSetOverviewDetails,
  },
  {
    name: 'Resources',
    component: OverviewDetailsResourcesTab,
  },
];

export const StatefulSetOverview: React.SFC<StatefulSetOverviewProps> = ({
  item,
  customActions,
}) => (
  <ResourceOverviewDetails
    item={item}
    kindObj={StatefulSetModel}
    menuActions={customActions ? [...customActions, ...menuActions] : menuActions}
    tabs={tabs}
  />
);

type StatefulSetOverviewDetailsProps = {
  item: OverviewItem;
};

type StatefulSetOverviewProps = {
  item: OverviewItem;
  customActions?: KebabAction[];
};
