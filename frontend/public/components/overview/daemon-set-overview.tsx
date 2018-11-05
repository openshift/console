import * as React from 'react';

import { DaemonSetModel } from '../../models';
import { ResourceSummary } from '../utils';
import { ResourceOverviewDetails } from './resource-overview-details';
import {
  menuActions,
  DaemonSetDetailsList
} from '../daemon-set';

import { NetworkingOverview } from './networking-overview';
import { BuildConfigsOverview } from './build-configs-overview';

const DaemonSetOverviewDetails: React.SFC<{item:any}> = ({item}) =>
  <div className="co-m-pane__body resource-overview__body">
    <div className="resource-overview__summary">
      <ResourceSummary resource={item.obj} />
    </div>
    <div className="resource-overview__details">
      <DaemonSetDetailsList ds={item.obj} />
    </div>
  </div>;

const DaemonSetResourceOverview: React.SFC<{item: any}> = ({item: {buildConfigs, routes, services}}) => (
  <div className="overview__sidebar-pane-body">
    <BuildConfigsOverview buildConfigs={buildConfigs} />
    <NetworkingOverview services={services} routes={routes} />
  </div>
);

const tabs = [
  {
    name: 'Overview',
    component: DaemonSetOverviewDetails
  },
  {
    name: 'Resources',
    component: DaemonSetResourceOverview
  }
];

export const DaemonSetOverview: React.SFC<{item: any}> = ({item}) =>
  <ResourceOverviewDetails
    item={item}
    kindObj={DaemonSetModel}
    menuActions={menuActions}
    tabs={tabs}
  />;
