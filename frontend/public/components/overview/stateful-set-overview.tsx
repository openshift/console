import * as React from 'react';

import { StatefulSetModel } from '../../models';
import { menuActions } from '../stateful-set';
import { ResourceSummary } from '../utils';

import { OverviewDetailsResourcesTab } from './resource-overview-page';
import { OverviewItem } from '.';
import { ResourceOverviewDetails } from './resource-overview-details';

const StatefulSetOverviewDetails: React.SFC<StatefulSetOverviewDetailsProps> = ({item}) =>
  <div className="overview__sidebar-pane-body resource-overview__body">
    <ResourceSummary resource={item.obj} showPodSelector={true} />
  </div>;

const tabs = [
  {
    name: 'Overview',
    component: StatefulSetOverviewDetails,
  },
  {
    name: 'Resources',
    component: OverviewDetailsResourcesTab,
  },
];

export const StatefulSetOverview: React.SFC<StatefulSetOverviewProps> = ({item}) =>
  <ResourceOverviewDetails
    item={item}
    kindObj={StatefulSetModel}
    menuActions={menuActions}
    tabs={tabs}
  />;

/* eslint-disable no-unused-vars, no-undef */
type StatefulSetOverviewDetailsProps = {
  item: OverviewItem;
};

type StatefulSetOverviewProps = {
  item: OverviewItem;
};
/* eslint-enable no-unused-vars, no-undef */
