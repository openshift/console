import * as React from 'react';

import { StatefulSetModel } from '../../models';
import { menuActions } from '../stateful-set';
import { ResourceSummary } from '../utils';

import { OverviewDetailsResourcesTab } from './resource-overview-page';
import { ResourceOverviewDetails } from './resource-overview-details';
import { OverviewItem } from '@console/shared';

const StatefulSetOverviewDetails: React.SFC<StatefulSetOverviewDetailsProps> = ({ item }) => (
  <div className="overview__sidebar-pane-body resource-overview__body">
    <ResourceSummary resource={item.obj} showPodSelector showNodeSelector showTolerations />
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

export const StatefulSetOverview: React.SFC<StatefulSetOverviewProps> = ({ item }) => (
  <ResourceOverviewDetails
    item={item}
    kindObj={StatefulSetModel}
    menuActions={menuActions}
    tabs={tabs}
  />
);

type StatefulSetOverviewDetailsProps = {
  item: OverviewItem;
};

type StatefulSetOverviewProps = {
  item: OverviewItem;
};
