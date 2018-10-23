import * as React from 'react';

import { StatefulSetModel } from '../../models';
import { menuActions } from '../stateful-set';
import { ResourceSummary } from '../utils';

import { NetworkingOverview } from './networking-overview';
import { ResourceOverviewDetails } from './resource-overview-details';

const StatefulSetOverviewDetails: React.SFC<{item:any}> = ({item}) =>
  <div className="overview__sidebar-pane-body resource-overview__body">
    <ResourceSummary resource={item.obj} />
  </div>;

const StatefulSetResourceOverview: React.SFC<{item:any}> = ({item: {services, routes}}) =>
  <NetworkingOverview services={services} routes={routes} />;

const tabs = [
  {
    name: 'Overview',
    component: StatefulSetOverviewDetails
  },
  {
    name: 'Resources',
    component: StatefulSetResourceOverview
  }
];

export const StatefulSetOverview: React.SFC<{item:any}> = ({item}) =>
  <ResourceOverviewDetails
    item={item}
    kindObj={StatefulSetModel}
    menuActions={menuActions}
    tabs={tabs}
  />;
