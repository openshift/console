/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';

import { VirtualMachineModel } from '../../../models';
import { ResourceSummary } from '../../../components/utils';
import { OverviewItem } from '../../../components/overview';
import { NetworkingOverview } from '../../../components/overview/networking-overview';
import { ResourceOverviewDetails } from '../../../components/overview/resource-overview-details';

import { menuActions } from './vm-list';

const VirtualMachineOverviewDetails: React.SFC<VirtualMachineOverviewDetailsProps> = ({ item }) =>
  <div className="overview__sidebar-pane-body resource-overview__body">
    <div className="resource-overview__summary">
      <ResourceSummary resource={item.obj} />
    </div>
  </div>;

const VirtualMachineResourcesTab: React.SFC<VirtualMachineResourcesTabProps> = ({ item: { routes, services } }) =>
  <div className="overview__sidebar-pane-body">
    <NetworkingOverview services={services} routes={routes} />
  </div>;

const tabs = [
  {
    name: 'Overview',
    component: VirtualMachineOverviewDetails,
  },
  {
    name: 'Resources',
    component: VirtualMachineResourcesTab,
  },
];

export const VirtualMachineOverviewPage: React.SFC<VirtualMachineOverviewProps> = ({ item }) =>
  <ResourceOverviewDetails
    item={item}
    kindObj={VirtualMachineModel}
    menuActions={menuActions}
    tabs={tabs}
  />;

type VirtualMachineOverviewDetailsProps = {
  item: OverviewItem;
};

type VirtualMachineResourcesTabProps = {
  item: OverviewItem;
};

type VirtualMachineOverviewProps = {
  item: OverviewItem;
};
