import * as React from 'react';

import { DaemonSetModel } from '../../models';
import { ResourceSummary } from '../utils';
import {
  menuActions,
  DaemonSetDetailsList,
} from '../daemon-set';


import { OverviewDetailsResourcesTab } from './resource-overview-page';
import { OverviewItem } from '.';
import { ResourceOverviewDetails } from './resource-overview-details';

const DaemonSetOverviewDetails: React.SFC<DaemonSetOverviewDetailsProps> = ({item}) =>
  <div className="co-m-pane__body resource-overview__body">
    <div className="resource-overview__summary">
      <ResourceSummary resource={item.obj} />
    </div>
    <div className="resource-overview__details">
      <DaemonSetDetailsList ds={item.obj} />
    </div>
  </div>;

const tabs = [
  {
    name: 'Overview',
    component: DaemonSetOverviewDetails,
  },
  {
    name: 'Resources',
    component: OverviewDetailsResourcesTab,
  },
];

export const DaemonSetOverview: React.SFC<DaemonSetOverviewProps> = ({item}) =>
  <ResourceOverviewDetails
    item={item}
    kindObj={DaemonSetModel}
    menuActions={menuActions}
    tabs={tabs}
  />;

/* eslint-disable no-unused-vars, no-undef */
type DaemonSetOverviewDetailsProps = {
  item: OverviewItem;
};

type DaemonSetOverviewProps = {
  item: OverviewItem;
};
/* eslint-enable no-unused-vars, no-undef */
